import jwt from 'jsonwebtoken';

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
  const token = auth.replace('Bearer ', '');
  const decoded = verifyToken(token);
  return decoded?.userId || null;
}
