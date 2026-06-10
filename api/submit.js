import { getFile, putFile } from './_github.js';

const clamp = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const b = req.body || {};

  // Honeypot: real users never see/fill the "website" field.
  if (b.website) return res.status(200).json({ ok: true }); // silently accept, drop

  const name = clamp(b.name, 160);
  if (!name) return res.status(400).json({ error: 'School name is required.' });

  const entry = {
    _id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    _source: 'submission',
    _submittedAt: new Date().toISOString(),
    name,
    town: clamp(b.town, 80),
    county: clamp(b.county, 60),
    sector: clamp(b.sector, 20) || 'public',
    storage: clamp(b.storage, 20) || 'unknown',
    level: clamp(b.level, 40),
    effective: clamp(b.effective, 40),
    sourceUrl: /^https?:\/\//.test(b.sourceUrl || '') ? clamp(b.sourceUrl, 400) : '',
    notes: clamp(b.notes, 1500),
    submitterEmail: clamp(b.submitterEmail, 160),
  };

  try {
    const { content } = await getFile('public/data/pending.json');
    const data = content ? JSON.parse(content) : { pending: [] };
    if (!Array.isArray(data.pending)) data.pending = [];
    if (data.pending.length > 500) {
      return res.status(429).json({ error: 'Review queue is full; please try later.' });
    }
    data.pending.push(entry);
    await putFile(
      'public/data/pending.json',
      JSON.stringify(data, null, 2) + '\n',
      `New school submission: ${name}`
    );
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'Could not save submission. Please try again.' });
  }
}
