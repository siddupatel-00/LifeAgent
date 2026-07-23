import db from './lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if email already in waitlist
    const existing = await db.execute({
      sql: 'SELECT id FROM waitlist WHERE email = ?',
      args: [email]
    });

    if (existing.rows.length > 0) {
      return res.status(200).json({ success: true, message: 'Already on the waitlist!' });
    }

    // Insert into waitlist
    await db.execute({
      sql: 'INSERT INTO waitlist (name, email) VALUES (?, ?)',
      args: [name || '', email]
    });

    res.status(201).json({ success: true, message: 'Added to waitlist!' });
  } catch (error) {
    console.error('Waitlist error:', error);
    res.status(500).json({ error: 'Failed to join waitlist' });
  }
}
