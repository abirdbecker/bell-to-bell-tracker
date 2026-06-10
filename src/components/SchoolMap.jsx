import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { STORAGE_METHODS, methodMeta } from '../lib/storage.js';
import { PA_COUNTIES } from '../data/paCountyCentroids.js';

const GEO_URL = '/data/pa-counties.json';
const CENTROIDS = Object.fromEntries(PA_COUNTIES.map((c) => [c.name, [c.lng, c.lat]]));
const normCounty = (c) => (c || '').replace(/\s+county$/i, '').trim();

// Resolve a pin position for each school: use its exact lat/lng when present,
// otherwise fall back to the county centroid (jittered so co-located schools
// don't stack) — a safety net so an approved school with no coords yet is still
// visible. Precise placement comes from geocoding the office/school address.
function resolvePins(schools) {
  const stored = {};
  for (const s of schools) {
    if (s.lat != null && s.lng != null && s.county) {
      const k = normCounty(s.county);
      stored[k] = (stored[k] || 0) + 1;
    }
  }
  const fbIndex = {};
  const place = (lng, lat, n) => {
    if (n === 0) return [lng, lat];
    const ang = n * 2.39996;
    const rad = 0.06 + 0.03 * n;
    return [lng + rad * Math.cos(ang), lat + rad * Math.sin(ang)];
  };
  const pins = schools
    .map((s) => {
      let { lng, lat } = s;
      const k = normCounty(s.county);
      if ((lng == null || lat == null) && CENTROIDS[k]) {
        const [clng, clat] = CENTROIDS[k];
        const base = stored[k] || 0;
        const i = (fbIndex[k] = (fbIndex[k] ?? -1) + 1);
        [lng, lat] = place(clng, clat, base + i);
      }
      return lng != null && lat != null ? { ...s, lng, lat } : null;
    })
    .filter(Boolean);

  // De-collision: two schools at the same spot (e.g. two schools in one town)
  // would draw on top of each other — fan duplicates out so each pin is visible.
  const seen = {};
  for (const p of pins) {
    const key = `${p.lng.toFixed(2)},${p.lat.toFixed(2)}`;
    const n = seen[key] || 0;
    if (n > 0) {
      const ang = n * 2.39996;
      const rad = 0.05 + 0.02 * n;
      p.lng += rad * Math.cos(ang);
      p.lat += rad * Math.sin(ang);
    }
    seen[key] = n + 1;
  }
  return pins;
}

export default function SchoolMap({ schools, highlightCounty, onCountyClick }) {
  const [tooltip, setTooltip] = useState(null);

  const byCounty = useMemo(() => {
    const m = {};
    for (const s of schools) if (s.county) m[s.county] = (m[s.county] || 0) + 1;
    return m;
  }, [schools]);

  const pins = useMemo(() => resolvePins(schools), [schools]);

  return (
    <div className="map-block">
      <div className="county-map-wrap">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 7000, center: [-77.6, 40.9] }}
          width={800}
          height={420}
          style={{ width: '100%', height: 'auto' }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const county = geo.properties.name;
                const active = highlightCounty === county;
                const has = byCounty[county] > 0;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={active ? '#dCEbe1' : has ? '#eaf2ed' : '#f4f1e9'}
                    stroke={active ? '#2d5a3d' : '#cfc8bb'}
                    strokeWidth={active ? 1.2 : 0.6}
                    style={{
                      default: { outline: 'none' },
                      hover: { outline: 'none', cursor: has ? 'pointer' : 'default', opacity: 0.9 },
                      pressed: { outline: 'none' },
                    }}
                    onClick={() => has && onCountyClick?.(county)}
                  />
                );
              })
            }
          </Geographies>

          {pins.map((s) => {
            const meta = methodMeta(s.storage?.category);
            return (
              <Marker
                key={s.id}
                coordinates={[s.lng, s.lat]}
                onMouseEnter={(e) => setTooltip({ s, x: e.clientX, y: e.clientY })}
                onMouseMove={(e) => setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : t))}
                onMouseLeave={() => setTooltip(null)}
                onClick={() => s.county && onCountyClick?.(s.county)}
                style={{ default: { cursor: 'pointer' } }}
              >
                <circle r={5} fill={meta.color} stroke="#fff" strokeWidth={1.2} fillOpacity={0.92} />
              </Marker>
            );
          })}
        </ComposableMap>

        {tooltip && (
          <div className="map-tooltip" style={{ left: tooltip.x + 12, top: tooltip.y - 52 }}>
            <strong>{tooltip.s.name}</strong>
            <br />
            {tooltip.s.town ? `${tooltip.s.town} · ` : ''}
            {methodMeta(tooltip.s.storage?.category).short}
          </div>
        )}
      </div>

      <ul className="map-legend">
        {STORAGE_METHODS.filter((m) => schools.some((s) => s.storage?.category === m.key)).map((m) => (
          <li key={m.key}>
            <span className="legend-dot" style={{ background: m.color }} />
            {m.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
