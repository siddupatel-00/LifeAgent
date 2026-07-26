import jwt from 'jsonwebtoken';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}
const JWT_SECRET = process.env.JWT_SECRET || 'lifeagent_secret';

export function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getUserId(req) {
  const auth = req.headers.get?.('authorization') || req.headers?.authorization || '';
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}
