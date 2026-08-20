import { handleCors } from '../lib/cors.js';
import db, { ensureDbSchema } from '../lib/db.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../lib/auth.js';
import { sendPasswordResetEmail } from '../lib/email.js';

import { getUserId } from '../lib/auth.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  if (handleCors(req, res)) return;

  await ensureDbSchema();
  const { action } = req.query;
  const body = req.body || {};

  // Waitlist submission handler
  if (req.method === 'POST' && (action === 'waitlist' || body.action === 'waitlist')) {
    try {
      const { name, email } = body;
      if (!email) return res.status(400).json({ error: 'Email is required' });
      const existing = await db.execute({ sql: 'SELECT id FROM waitlist WHERE email = ?', args: [email] });
      if (existing.rows.length > 0) return res.status(200).json({ success: true, message: 'Already on the waitlist!' });
      await db.execute({ sql: 'INSERT INTO waitlist (name, email) VALUES (?, ?)', args: [name || '', email] });
      return res.status(201).json({ success: true, message: 'Added to waitlist!' });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to join waitlist' });
    }
  }

  // GET /api/auth?action=founder -> Fetch messages & user timeline telemetry for owner
  if (req.method === 'GET' && (action === 'founder' || action === 'founder_telemetry')) {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
      const [messagesRes, usersCountRes, timelineRes, unreadRes] = await Promise.all([
        db.execute({
          sql: 'SELECT id, name, email, message, created_at, is_read FROM founder_messages ORDER BY created_at DESC LIMIT 100'
        }),
        db.execute({
          sql: 'SELECT count(*) as total FROM users'
        }),
        db.execute({
          sql: `SELECT date(created_at) as date, count(*) as count FROM users WHERE created_at IS NOT NULL GROUP BY date(created_at) ORDER BY date DESC LIMIT 30`
        }),
        db.execute({
          sql: 'SELECT count(*) as unread FROM founder_messages WHERE is_read = 0'
        })
      ]);

      const totalUsers = usersCountRes.rows?.[0]?.total || 0;
      const unreadCount = unreadRes.rows?.[0]?.unread || 0;
      const messages = messagesRes.rows || [];
      const userTimeline = (timelineRes.rows || []).map(r => ({
        date: r.date || 'Unknown',
        count: Number(r.count) || 0
      }));

      return res.status(200).json({
        totalUsers,
        unreadCount,
        messages,
        userTimeline
      });
    } catch (err) {
      console.error('Founder telemetry error:', err);
      return res.status(500).json({ error: 'Failed to fetch founder data' });
    }
  }

  // POST /api/auth?action=founder_message (or action=founder)
  if (req.method === 'POST' && (action === 'founder_message' || action === 'founder')) {
    const subAction = body.subAction || body.action || req.query.subAction;

    // Public visitor message
    if (!subAction || subAction === 'send' || body.message) {
      const { name, email, message } = body;
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message content is required.' });
      }

      await db.execute({
        sql: 'INSERT INTO founder_messages (name, email, message, created_at, is_read) VALUES (?, ?, ?, datetime(\'now\'), 0)',
        args: [name?.trim() || 'Anonymous Visitor', email?.trim() || '', message.trim()]
      });

      return res.status(201).json({
        success: true,
        message: 'Your message has been sent directly to the founder. Thank you!'
      });
    }

    // Owner actions
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (subAction === 'mark_read') {
      const messageId = body.id || req.query.id;
      if (!messageId) return res.status(400).json({ error: 'Message ID is required.' });

      await db.execute({
        sql: 'UPDATE founder_messages SET is_read = 1 WHERE id = ?',
        args: [messageId]
      });

      return res.status(200).json({ success: true, message: 'Message marked as read.' });
    }

    if (subAction === 'delete') {
      const messageId = body.id || req.query.id;
      if (!messageId) return res.status(400).json({ error: 'Message ID is required.' });

      await db.execute({
        sql: 'DELETE FROM founder_messages WHERE id = ?',
        args: [messageId]
      });

      return res.status(200).json({ success: true, message: 'Message deleted.' });
    }
  }

  // GET /api/auth?action=me -> Session validation
  if (req.method === 'GET' && action === 'me') {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized session' });

    try {
      const userRes = await db.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [userId] });
      if (userRes.rows.length === 0) return res.status(401).json({ error: 'User not found' });
      const user = userRes.rows[0];
      return res.status(200).json({
        user: {
          id: Number(user.id),
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          handle: user.handle || '',
          theme: user.theme || 'light',
          ai_name: user.ai_name || 'AI',
          currency: user.currency || '$'
        }
      });
    } catch {
      return res.status(401).json({ error: 'Session verification failed' });
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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
