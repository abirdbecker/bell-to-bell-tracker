import { isAuthed } from './_auth.js';
import { putFile } from './_github.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAuthed(req)) return res.status(401).json({ error: 'Not authorized' });

  const { schools, pending } = req.body || {};
  if (!schools || !Array.isArray(schools.schools)) {
    return res.status(400).json({ error: 'Missing schools payload' });
  }

  try {
    const date = new Date().toISOString().slice(0, 10);
    await putFile(
      'public/data/schools.json',
      JSON.stringify(schools, null, 2) + '\n',
      `Update schools (${schools.schools.length}) — ${date} [admin]`
    );
    if (pending && Array.isArray(pending.pending)) {
      await putFile(
        'public/data/pending.json',
        JSON.stringify(pending, null, 2) + '\n',
        `Update review queue (${pending.pending.length}) — ${date} [admin]`
      );
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
