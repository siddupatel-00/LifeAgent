import db from '../../lib/db.js';
import bcrypt from 'bcryptjs';
import { signToken } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE email = ?', args: [email] });
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
        gemini_api_key: user.gemini_api_key
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
