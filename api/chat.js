import db from '../lib/db.js';
import { getUserId } from '../lib/auth.js';

export default async function handler(req, res) {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  try {
    if (req.method === 'GET') {
      const chat = await db.execute({ 
        sql: 'SELECT * FROM chat_history WHERE user_id = ? ORDER BY created_at ASC', 
        args: [userId] 
      });
      return res.status(200).json(chat.rows);
    }
    
    if (req.method === 'POST') {
      // Allow batch inserting multiple messages (e.g., user + ai response together)
      const messages = Array.isArray(req.body) ? req.body : [req.body];
      
      const statements = messages.map(msg => ({
        sql: 'INSERT INTO chat_history (user_id, sender, text, time) VALUES (?, ?, ?, ?)',
        args: [userId, msg.sender, msg.text, msg.time || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })]
      }));
      
      if (statements.length > 0) {
        await db.batch(statements);
      }
      return res.status(201).json({ success: true });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
