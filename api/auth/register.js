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
    
    // Create default habits for new user
    await db.batch([
      { sql: 'INSERT INTO habits (user_id, label, category, streak) VALUES (?, ?, ?, ?)', args: [userId, 'Gym & Strength Workout', 'Body & Gym', 0] },
      { sql: 'INSERT INTO habits (user_id, label, category, streak) VALUES (?, ?, ?, ?)', args: [userId, 'Focused Study Blocks', 'Study', 0] },
      { sql: 'INSERT INTO habits (user_id, label, category, streak) VALUES (?, ?, ?, ?)', args: [userId, 'Code & Build Projects', 'Coding', 0] },
      { sql: 'INSERT INTO habits (user_id, label, category, streak) VALUES (?, ?, ?, ?)', args: [userId, 'Solve DSA Problems', 'DSA', 0] },
    ]);
    
    // Create default today items
    await db.batch([
      { sql: 'INSERT INTO today_items (user_id, label, time, category) VALUES (?, ?, ?, ?)', args: [userId, 'Wake up at exact time & hydrate', '06:30 AM', 'Routine'] },
      { sql: 'INSERT INTO today_items (user_id, label, time, category) VALUES (?, ?, ?, ?)', args: [userId, 'Gym & Strength Workout (60 mins)', '07:00 AM', 'Body & Gym'] },
      { sql: 'INSERT INTO today_items (user_id, label, time, category) VALUES (?, ?, ?, ?)', args: [userId, 'Focused Study & College Blocks', '09:00 AM – 07:00 PM', 'Study'] },
      { sql: 'INSERT INTO today_items (user_id, label, time, category) VALUES (?, ?, ?, ?)', args: [userId, 'Solve 3 DSA / LeetCode Problems', '08:00 PM – 11:00 PM', 'Coding'] },
      { sql: 'INSERT INTO today_items (user_id, label, time, category) VALUES (?, ?, ?, ?)', args: [userId, 'Wind Down & Sleep by 11 PM', '11:00 PM', 'Sleep'] },
    ]);
    
    res.status(201).json({ token, user: { id: userId, name, email, handle: handle || `@${email.split('@')[0]}` } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
