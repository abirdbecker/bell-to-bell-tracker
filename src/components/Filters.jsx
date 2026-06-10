import { useMemo } from 'react';
import { STORAGE_METHODS, SECTORS } from '../lib/storage.js';

export default function Filters({ schools, filters, setFilters, resultCount, onReset, filtersActive }) {
  const counties = useMemo(
    () => [...new Set(schools.map((s) => s.county).filter(Boolean))].sort(),
    [schools]
  );
  const years = useMemo(
    () => [...new Set(schools.map((s) => s.year).filter(Boolean))].sort((a, b) => b - a),
    [schools]
  );
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="filters">
      <input
        className="filter-search"
        type="search"
        placeholder="Search by school, town, or policy…"
        value={filters.q}
        onChange={set('q')}
      />
      <div className="filter-row">
        <select value={filters.method} onChange={set('method')} aria-label="Storage method">
          <option value="all">All methods</option>
          {STORAGE_METHODS.filter((m) => schools.some((s) => s.storage?.category === m.key)).map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>
        <select value={filters.sector} onChange={set('sector')} aria-label="School type">
          <option value="all">All types</option>
          {SECTORS.filter((s) => schools.some((x) => x.sector === s.key)).map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
        <select value={filters.county} onChange={set('county')} aria-label="County">
          <option value="all">All counties</option>
          {counties.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filters.year} onChange={set('year')} aria-label="Effective year">
          <option value="all">All years</option>
          {years.map((y) => <option key={y} value={String(y)}>{y}</option>)}
        </select>
        {filtersActive && (
          <button className="filter-reset" onClick={onReset}>Clear</button>
        )}
      </div>
      <p className="result-count">
        {resultCount} {resultCount === 1 ? 'school' : 'schools'}
      </p>
    </div>
  );
}
