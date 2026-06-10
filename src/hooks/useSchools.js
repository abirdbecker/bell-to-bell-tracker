import { useEffect, useState } from 'react';

// Loads the published dataset. schools.json is the source of truth — it is
// committed to the repo and edited via /admin, so a plain fetch is all we need.
export function useSchools() {
  const [data, setData] = useState({ schools: [], updatedAt: null });
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    fetch('/data/schools.json', { cache: 'no-cache' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        const schools = (d.schools || []).filter((s) => s.status !== 'archived');
        setData({ schools, updatedAt: d.updatedAt || null });
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  return { ...data, status };
}
