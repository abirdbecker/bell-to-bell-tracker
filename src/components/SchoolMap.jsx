import { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { STORAGE_METHODS, methodMeta } from '../lib/storage.js';

const GEO_URL = '/data/pa-counties.json';

export default function SchoolMap({ schools, highlightCounty, onCountyClick }) {
  const [tooltip, setTooltip] = useState(null);

  const byCounty = useMemo(() => {
    const m = {};
    for (const s of schools) if (s.county) m[s.county] = (m[s.county] || 0) + 1;
    return m;
  }, [schools]);

  const pins = useMemo(() => schools.filter((s) => s.lat != null && s.lng != null), [schools]);

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
