import { methodMeta, sectorLabel } from '../lib/storage.js';

export default function SchoolList({ schools, onSelect }) {
  if (!schools.length) {
    return <p className="notice">No schools match these filters.</p>;
  }
  return (
    <ul className="school-grid">
      {schools.map((s) => {
        const meta = methodMeta(s.storage?.category);
        return (
          <li key={s.id}>
            <button className="school-card" onClick={() => onSelect(s)}>
              <span className="school-method-tag" style={{ background: meta.color }}>
                {meta.short}
              </span>
              <h3 className="school-name">{s.name}</h3>
              <p className="school-meta">
                {[s.town, s.county && `${s.county} County`].filter(Boolean).join(' · ')}
              </p>
              <p className="school-meta-2">
                {sectorLabel(s.sector)}
                {s.students ? ` · ${s.students.toLocaleString()} students` : ''}
                {s.effective ? ` · since ${s.effective}` : ''}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
