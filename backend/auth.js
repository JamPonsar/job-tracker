import crypto from 'crypto';

export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET environment variable is required.');
  return secret;
}

function sign(payload) {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function checkCredentials(username, password) {
  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;
  if (!validUsername || !validPassword) {
    throw new Error('AUTH_USERNAME and AUTH_PASSWORD environment variables are required.');
  }
  return safeEqual(username, validUsername) && safeEqual(password, validPassword);
}

export function createSessionToken() {
  const payload = JSON.stringify({ exp: Date.now() + SESSION_MAX_AGE });
  const encodedPayload = Buffer.from(payload).toString('base64url');
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;

  const [encodedPayload, signature] = token.split('.');
  const expected = sign(encodedPayload);
  const a = Buffer.from(signature || '', 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export function requireAuth(req, res, next) {
  if (!verifySessionToken(req.cookies?.[SESSION_COOKIE])) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  next();
}
