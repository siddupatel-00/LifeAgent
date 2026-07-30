import { handleCors } from './_cors.js';
import db, { ensureDbSchema } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../lib/auth.js';
import { sendPasswordResetEmail } from '../lib/email.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  await ensureDbSchema();
  const { action } = req.query;
  const body = req.body || {};

  try {
    if (action === 'register') {
      const { name, email, phone, handle, password } = body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

      const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (!cleanEmail || !EMAIL_REGEX.test(cleanEmail)) {
        return res.status(400).json({ error: 'Invalid email address format' });
      }

      const existing = await db.execute({ sql: 'SELECT id FROM users WHERE LOWER(email) = ?', args: [cleanEmail] });
      if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

      const cleanHandle = (handle && typeof handle === 'string' && handle.trim())
        ? (handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`)
        : `@${cleanEmail.split('@')[0]}`;

      const rawHandle = cleanHandle.replace(/^@/, '').toLowerCase();
      const existingHandle = await db.execute({
        sql: 'SELECT id FROM users WHERE LOWER(handle) = ? OR LOWER(handle) = ?',
        args: [`@${rawHandle}`, rawHandle]
      });
      if (existingHandle.rows.length > 0) {
        return res.status(409).json({ error: `Username ${cleanHandle} is already taken. Please choose a different username.` });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const result = await db.execute({
        sql: 'INSERT INTO users (name, email, phone, handle, password_hash) VALUES (?, ?, ?, ?, ?)',
        args: [name ? String(name).trim() : '', cleanEmail, phone ? String(phone).trim() : '', cleanHandle, password_hash]
      });

      const userId = Number(result.lastInsertRowid);
      const token = signToken(userId);

      return res.status(201).json({ token, user: { id: userId, name: name ? String(name).trim() : '', email: cleanEmail, handle: cleanHandle, theme: 'light', ai_name: 'AI', gemini_api_key: '', groq_api_key: '', ai_provider: 'gemini', currency: '$' } });
    }

    if (action === 'forgot-password') {
      const { emailOrHandle } = body;
      if (!emailOrHandle || typeof emailOrHandle !== 'string' || !emailOrHandle.trim()) {
        return res.status(400).json({ error: 'Email or username is required' });
      }

      const cleanInput = emailOrHandle.trim();
      const userRes = await db.execute({
        sql: 'SELECT * FROM users WHERE email = ? OR handle = ? OR handle = ?',
        args: [cleanInput.toLowerCase(), cleanInput, `@${cleanInput.replace(/^@/, '')}`]
      });

      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'User account not found' });
      }

      const user = userRes.rows[0];
      // Generate 6-digit OTP code
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

      await db.execute({
        sql: 'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
        args: [resetCode, expiresAt, user.id]
      });

      const emailResult = await sendPasswordResetEmail({
        toEmail: user.email,
        userName: user.name || user.handle,
        resetCode
      });

      const emailSent = Boolean(emailResult && emailResult.success && (emailResult.method === 'gmail' || emailResult.method === 'resend'));

      if (!emailSent) {
        console.error('[Auth] Email delivery failed:', emailResult?.error);
        return res.status(500).json({ error: `Failed to send reset email. Please try again. (${emailResult?.error || 'Unknown error'})` });
      }

      return res.status(200).json({
        message: `✉️ Reset code sent! Check your inbox.`,
        emailSent: true
      });
    }

    if (action === 'verify-reset-code') {
      const { emailOrHandle, code } = body;
      if (!emailOrHandle || !code) {
        return res.status(400).json({ error: 'Email/username and reset code are required' });
      }

      const cleanInput = typeof emailOrHandle === 'string' ? emailOrHandle.trim() : '';
      const cleanCode = typeof code === 'string' ? code.trim() : String(code).trim();

      const userRes = await db.execute({
        sql: 'SELECT * FROM users WHERE (email = ? OR handle = ? OR handle = ?) AND reset_token = ?',
        args: [cleanInput.toLowerCase(), cleanInput, `@${cleanInput.replace(/^@/, '')}`, cleanCode]
      });

      if (userRes.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid 6-digit reset code' });
      }

      const user = userRes.rows[0];
      if (Number(user.reset_token_expires) < Date.now()) {
        return res.status(400).json({ error: 'Reset code has expired. Please request a new code.' });
      }

      return res.status(200).json({ success: true, message: 'Reset code verified successfully!' });
    }

    if (action === 'reset-password') {
      const { emailOrHandle, code, newPassword } = body;
      if (!emailOrHandle || !code || !newPassword) {
        return res.status(400).json({ error: 'Email/username, reset code, and new password are required' });
      }

      const cleanInput = typeof emailOrHandle === 'string' ? emailOrHandle.trim() : '';
      const cleanCode = typeof code === 'string' ? code.trim() : String(code).trim();

      const userRes = await db.execute({
        sql: 'SELECT * FROM users WHERE (email = ? OR handle = ? OR handle = ?) AND reset_token = ?',
        args: [cleanInput.toLowerCase(), cleanInput, `@${cleanInput.replace(/^@/, '')}`, cleanCode]
      });

      if (userRes.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid reset code or username' });
      }

      const user = userRes.rows[0];
      if (Number(user.reset_token_expires) < Date.now()) {
        return res.status(400).json({ error: 'Reset code has expired. Please request a new code.' });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await db.execute({
        sql: 'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
        args: [newPasswordHash, user.id]
      });

      return res.status(200).json({ message: 'Password reset successful! You can now sign in.' });
    }

    // Default: login
    const { email, password } = body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const cleanInput = typeof email === 'string' ? email.trim() : '';
    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE email = ? OR handle = ? OR handle = ?',
      args: [cleanInput.toLowerCase(), cleanInput, `@${cleanInput.replace(/^@/, '')}`]
    });
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = signToken(Number(user.id));

    res.status(200).json({
      token,
      user: {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        phone: user.phone,
        handle: user.handle,
        theme: user.theme,
        ai_name: user.ai_name,
        gemini_api_key: user.gemini_api_key,
        groq_api_key: user.groq_api_key,
        ai_provider: user.ai_provider,
        currency: user.currency
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
