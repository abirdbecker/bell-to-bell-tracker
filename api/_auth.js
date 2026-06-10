import crypto from 'node:crypto';

const COOKIE = 'b2b_admin';

function secret() {
  // Prefer a dedicated session secret; fall back to the admin password.
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || '';
}

export function makeToken() {
  return crypto.createHmac('sha256', secret()).update('admin-session-v1').digest('hex');
}

export function setSessionCookie(res) {
  const maxAge = 60 * 60 * 8; // 8 hours
  res.setHeader('Set-Cookie',
    `${COOKIE}=${makeToken()}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${maxAge}`);
}

export function isAuthed(req) {
  const header = req.headers.cookie || '';
  const found = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${COOKIE}=`));
  if (!found) return false;
  const token = found.slice(COOKIE.length + 1);
  const expected = makeToken();
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected || !input || input.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(input), Buffer.from(expected));
}
