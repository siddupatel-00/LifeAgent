import db from '../lib/db.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { name, email, phone, handle, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const existing = await db.execute({ sql: 'SELECT id FROM users WHERE email = ?', args: [email] });
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
    
    const password_hash = await bcrypt.hash(password, 10);
    const result = await db.execute({
      sql: 'INSERT INTO users (name, email, phone, handle, password_hash) VALUES (?, ?, ?, ?, ?)',
      args: [name || '', email, phone || '', handle || `@${email.split('@')[0]}`, password_hash]
    });
    
    const userId = Number(result.lastInsertRowid);
    const token = signToken(userId);
    
    res.status(201).json({ token, user: { id: userId, name, email, handle: handle || `@${email.split('@')[0]}` } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
