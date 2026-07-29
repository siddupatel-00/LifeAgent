import db, { ensureDbSchema } from '../lib/db.js';
import { getUserId } from '../lib/auth.js';
import { resetUserData } from './settings.js';

export default async function handler(req, res) {
  await ensureDbSchema();
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'POST' || req.method === 'DELETE') {
      await resetUserData(userId);
      return res.status(200).json({ success: true, message: 'All account data reset successfully' });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
