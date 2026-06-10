import { useEffect, useState } from 'react';
import { STORAGE_METHODS, SECTORS } from '../lib/storage.js';

const FIELDS = { name: '', town: '', county: '', sector: 'public', storage: 'yondr', level: '', effective: '', sourceUrl: '', notes: '', submitterEmail: '' };

export default function SubmitForm({ onClose }) {
  const [form, setForm] = useState(FIELDS);
  const [hp, setHp] = useState(''); // honeypot — real users never fill this
  const [state, setState] = useState('idle'); // idle | sending | done | error
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('School name is required.'); return; }
    setState('sending'); setError('');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, website: hp }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      setState('done');
    } catch (err) {
      setState('error');
      setError(err.message || 'Something went wrong.');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {state === 'done' ? (
          <div className="submit-done">
            <h2 className="modal-title">Thank you!</h2>
            <p>Your submission was received and will be reviewed before it’s published.
              We verify each school against an official source first.</p>
            <button className="btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="submit-form">
            <h2 className="modal-title">Submit a school</h2>
            <p className="modal-sub">
              Know a PA school or district with a bell-to-bell phone policy? Tell us — we’ll verify
              it before adding it to the map.
            </p>

            <label>School / district name *
              <input value={form.name} onChange={set('name')} required />
            </label>
            <div className="form-2col">
              <label>Town / city
                <input value={form.town} onChange={set('town')} />
              </label>
              <label>County
                <input value={form.county} onChange={set('county')} />
              </label>
            </div>
            <div className="form-2col">
              <label>Type
                <select value={form.sector} onChange={set('sector')}>
                  {SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </label>
              <label>Storage method
                <select value={form.storage} onChange={set('storage')}>
                  {STORAGE_METHODS.filter((m) => !['other', 'unknown'].includes(m.key)).map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-2col">
              <label>Grade levels
                <input value={form.level} onChange={set('level')} placeholder="e.g. K-12" />
              </label>
              <label>In effect since
                <input value={form.effective} onChange={set('effective')} placeholder="e.g. 2025-2026" />
              </label>
            </div>
            <label>Source link (article or policy)
              <input type="url" value={form.sourceUrl} onChange={set('sourceUrl')} placeholder="https://…" />
            </label>
            <label>Notes / policy language
              <textarea rows={3} value={form.notes} onChange={set('notes')} />
            </label>
            <label>Your email (optional, in case we have questions)
              <input type="email" value={form.submitterEmail} onChange={set('submitterEmail')} />
            </label>

            {/* honeypot: hidden from humans, bots fill it and get rejected */}
            <input
              className="hp-field"
              tabIndex={-1}
              autoComplete="off"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
              aria-hidden="true"
            />

            {error && <p className="form-error">{error}</p>}
            <button className="btn-primary" type="submit" disabled={state === 'sending'}>
              {state === 'sending' ? 'Submitting…' : 'Submit for review'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
