import { checkPassword, setSessionCookie } from './_auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { password } = req.body || {};
  if (!checkPassword(password)) {
    return res.status(401).json({ error: 'Incorrect password' });
  }
  setSessionCookie(res);
  return res.status(200).json({ ok: true });
}
