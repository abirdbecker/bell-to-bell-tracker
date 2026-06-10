import { getFile, putFile, putBinaryFile } from './_github.js';

const clamp = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const MAX_PDF_BYTES = 3 * 1024 * 1024; // 3 MB

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
    // Optional PDF attachment (sent as base64 from the form).
    const att = b.attachment;
    if (att && att.dataBase64) {
      const bytes = Math.floor((att.dataBase64.length * 3) / 4);
      // 'JVBER' is the base64 prefix of '%PDF' — magic-byte check so the public
      // endpoint can't be used to host arbitrary file types.
      if (att.type !== 'application/pdf' || !att.dataBase64.startsWith('JVBER')) {
        return res.status(400).json({ error: 'Attachment must be a PDF.' });
      }
      if (bytes > MAX_PDF_BYTES) {
        return res.status(413).json({ error: 'PDF is too large (max 3 MB).' });
      }
      const safe = (att.name || 'policy.pdf').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-50);
      const path = `public/uploads/submissions/${entry._id}-${safe}`;
      await putBinaryFile(path, att.dataBase64, `Submission attachment: ${name}`);
      entry.attachmentUrl = '/' + path.replace(/^public\//, '');
      entry.attachmentName = att.name || 'policy.pdf';
    }

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
