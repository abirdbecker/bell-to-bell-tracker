import { useEffect, useState } from 'react';
import { STORAGE_METHODS, SECTORS, methodMeta } from '../lib/storage.js';

export default function Admin() {
  const [authed, setAuthed] = useState(false);
  return authed ? <AdminPanel onLogout={() => setAuthed(false)} /> : <Login onAuthed={() => setAuthed(true)} />;
}

function Login({ onAuthed }) {
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) throw new Error('Incorrect password');
      onAuthed();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-login">
      <form onSubmit={submit} className="modal">
        <h2 className="modal-title">Admin</h2>
        <p className="modal-sub">PA Bell-to-Bell Tracker</p>
        <label>Password
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? '…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

function AdminPanel() {
  const [schools, setSchools] = useState([]);
  const [pending, setPending] = useState([]);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [editing, setEditing] = useState(null); // {school, isNew, fromPendingId}
  const [save, setSave] = useState({ state: 'idle', msg: '' });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/data/schools.json', { cache: 'no-cache' }).then((r) => r.json()),
      fetch('/data/pending.json', { cache: 'no-cache' }).then((r) => r.json()).catch(() => ({ pending: [] })),
    ]).then(([s, p]) => {
      setSchools(s.schools || []);
      setUpdatedAt(s.updatedAt);
      setPending(p.pending || []);
    });
  }, []);

  const upsert = (school, fromPendingId) => {
    setSchools((list) => {
      const i = list.findIndex((x) => x.id === school.id);
      if (i >= 0) { const copy = [...list]; copy[i] = school; return copy.sort(byName); }
      return [...list, school].sort(byName);
    });
    if (fromPendingId) setPending((p) => p.filter((x) => x._id !== fromPendingId));
    setDirty(true);
    setEditing(null);
  };

  const remove = (id) => {
    if (!confirm('Remove this school from the published map?')) return;
    setSchools((list) => list.filter((x) => x.id !== id));
    setDirty(true);
  };

  const dismissPending = (pid) => {
    setPending((p) => p.filter((x) => x._id !== pid));
    setDirty(true);
  };

  const publish = async () => {
    setSave({ state: 'saving', msg: '' });
    try {
      const res = await fetch('/api/admin-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schools: { updatedAt: today(), schools: schools.slice().sort(byName) },
          pending: { pending },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setSave({ state: 'done', msg: 'Published — live in ~30s after Vercel redeploys.' });
      setDirty(false);
    } catch (err) {
      setSave({ state: 'error', msg: err.message });
    }
  };

  return (
    <div className="admin">
      <header className="admin-bar">
        <strong>Bell-to-Bell Admin</strong>
        <span className="admin-meta">{schools.length} published · {pending.length} pending</span>
        <div className="admin-actions">
          {dirty && <span className="dirty-dot">● unsaved changes</span>}
          <button className="btn-primary" onClick={publish} disabled={save.state === 'saving' || !dirty}>
            {save.state === 'saving' ? 'Publishing…' : 'Publish to site'}
          </button>
        </div>
      </header>
      {save.msg && <p className={save.state === 'error' ? 'form-error admin-msg' : 'admin-msg ok'}>{save.msg}</p>}

      <div className="admin-body">
        {pending.length > 0 && (
          <section>
            <h3>Review queue ({pending.length})</h3>
            <p className="admin-hint">Submitted by the public or found by the weekly discovery job. Approve to edit &amp; publish, or dismiss.</p>
            <ul className="admin-list">
              {pending.map((p) => (
                <li key={p._id} className="admin-row pending">
                  <div>
                    <strong>{p.name}</strong>
                    <span className="admin-row-meta">
                      {[p.town, p.county, p.source].filter(Boolean).join(' · ')}
                      {p._source === 'discovery' ? ' · 🤖 auto-found' : ' · ✉️ submitted'}
                    </span>
                    {p.sourceUrl && <a href={p.sourceUrl} target="_blank" rel="noreferrer" className="admin-link">source ↗</a>}
                    {p.notes && <p className="admin-notes">{p.notes}</p>}
                  </div>
                  <div className="admin-row-actions">
                    <button onClick={() => setEditing({ school: pendingToSchool(p), isNew: true, fromPendingId: p._id })}>Approve…</button>
                    <button className="ghost" onClick={() => dismissPending(p._id)}>Dismiss</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="admin-section-head">
            <h3>Published schools ({schools.length})</h3>
            <button onClick={() => setEditing({ school: blankSchool(), isNew: true })}>+ Add manually</button>
          </div>
          <ul className="admin-list">
            {schools.map((s) => (
              <li key={s.id} className="admin-row">
                <div>
                  <span className="legend-dot" style={{ background: methodMeta(s.storage?.category).color }} />
                  <strong>{s.name}</strong>
                  <span className="admin-row-meta">{[s.town, s.county].filter(Boolean).join(' · ')}</span>
                </div>
                <div className="admin-row-actions">
                  <button onClick={() => setEditing({ school: s, isNew: false })}>Edit</button>
                  <button className="ghost danger" onClick={() => remove(s.id)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {editing && (
        <EditSchool
          {...editing}
          onCancel={() => setEditing(null)}
          onSave={(school) => upsert(school, editing.fromPendingId)}
        />
      )}
    </div>
  );
}

function EditSchool({ school, isNew, onCancel, onSave }) {
  const [f, setF] = useState(school);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const setStorage = (e) => {
    const cat = e.target.value;
    const meta = methodMeta(cat);
    setF((x) => ({ ...x, storage: { ...x.storage, category: cat, label: meta.label } }));
  };

  const submit = (e) => {
    e.preventDefault();
    const out = {
      ...f,
      id: f.id || slugify(f.name),
      students: f.students ? Number(String(f.students).replace(/[^\d]/g, '')) || null : null,
      year: f.year || extractYear(f.effective),
      status: 'published',
    };
    onSave(out);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal admin-edit" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onCancel}>×</button>
        <h2 className="modal-title">{isNew ? 'Add school' : 'Edit school'}</h2>
        <form onSubmit={submit} className="submit-form">
          <label>Name *<input value={f.name || ''} onChange={set('name')} required /></label>
          <div className="form-2col">
            <label>Town<input value={f.town || ''} onChange={set('town')} /></label>
            <label>County<input value={f.county || ''} onChange={set('county')} /></label>
          </div>
          <div className="form-2col">
            <label>Type
              <select value={f.sector || 'public'} onChange={set('sector')}>
                {SECTORS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>
            <label>Storage method
              <select value={f.storage?.category || 'yondr'} onChange={setStorage}>
                {STORAGE_METHODS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
              </select>
            </label>
          </div>
          <div className="form-2col">
            <label>Grade levels<input value={f.level || ''} onChange={set('level')} /></label>
            <label>Students<input value={f.students || ''} onChange={set('students')} /></label>
          </div>
          <div className="form-2col">
            <label>In effect<input value={f.effective || ''} onChange={set('effective')} /></label>
            <label>Lat,Lng (optional)
              <input
                value={f.lat != null ? `${f.lat},${f.lng}` : ''}
                onChange={(e) => {
                  const [lat, lng] = e.target.value.split(',').map((n) => parseFloat(n.trim()));
                  setF((x) => ({ ...x, lat: isNaN(lat) ? null : lat, lng: isNaN(lng) ? null : lng }));
                }}
              />
            </label>
          </div>
          <label>Storage detail (free text)
            <input value={f.storage?.raw || ''} onChange={(e) => setF((x) => ({ ...x, storage: { ...x.storage, raw: e.target.value } }))} />
          </label>
          <label>Notes / policy language
            <textarea rows={3} value={f.notes || ''} onChange={set('notes')} />
          </label>
          <label>Contact<input value={f.contact || ''} onChange={set('contact')} /></label>
          <LinksEditor links={f.links || []} onChange={(links) => setF((x) => ({ ...x, links }))} />
          {!f.county && <p className="form-error">⚠ No county set — school won’t appear on the map.</p>}
          <button className="btn-primary">{isNew ? 'Add to list' : 'Update'}</button>
        </form>
      </div>
    </div>
  );
}

function LinksEditor({ links, onChange }) {
  const update = (i, key, val) => onChange(links.map((l, j) => (j === i ? { ...l, [key]: val } : l)));
  return (
    <div className="links-editor">
      <strong>Sources</strong>
      {links.map((l, i) => (
        <div className="form-2col" key={i}>
          <select value={l.kind} onChange={(e) => update(i, 'kind', e.target.value)}>
            <option value="article">Article</option>
            <option value="policy">Policy</option>
          </select>
          <input placeholder="URL" value={l.url} onChange={(e) => update(i, 'url', e.target.value)} />
          <button type="button" className="ghost" onClick={() => onChange(links.filter((_, j) => j !== i))}>×</button>
        </div>
      ))}
      <button type="button" className="ghost" onClick={() => onChange([...links, { kind: 'article', label: 'Article', url: '' }])}>
        + Add source
      </button>
    </div>
  );
}

// helpers
const byName = (a, b) => a.name.localeCompare(b.name);
const today = () => new Date().toISOString().slice(0, 10);
const slugify = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
const extractYear = (e) => { const m = String(e || '').match(/(19|20)\d{2}/); return m ? Number(m[0]) : null; };
const blankSchool = () => ({ name: '', sector: 'public', storage: { category: 'yondr' }, links: [], status: 'published' });
function pendingToSchool(p) {
  return {
    id: slugify(p.name), name: p.name, sector: p.sector || 'public', town: p.town || null, county: p.county || null,
    lat: null, lng: null, level: p.level || null, students: null,
    storage: { category: p.storage || 'unknown', label: methodMeta(p.storage).label, raw: null },
    effective: p.effective || null, year: extractYear(p.effective), notes: p.notes || null,
    links: p.sourceUrl ? [{ kind: 'article', label: 'Source', url: p.sourceUrl }] : [], contact: null, status: 'published',
  };
}
