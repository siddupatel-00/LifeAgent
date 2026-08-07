import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'lifeagent_secret';

export function signToken(userId) {
  return jwt.sign({ userId: String(userId) }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function getUserId(req) {
  try {
    let auth = '';
    if (req?.headers) {
      if (typeof req.headers.get === 'function') {
        auth = req.headers.get('authorization') || req.headers.get('Authorization') || '';
      }
      if (!auth) {
        auth = req.headers.authorization || req.headers.Authorization || req.headers['authorization'] || req.headers['Authorization'] || '';
      }
    }
    if (!auth) return null;
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (!token) return null;
    const decoded = verifyToken(token);
    return decoded?.userId ? String(decoded.userId) : null;
  } catch {
    return null;
  }
}
