// Single source of truth for how phone-storage methods are labeled, ordered,
// and colored across the map, filters, legend, and cards.

export const STORAGE_METHODS = [
  { key: 'yondr',    label: 'Yondr pouches',          short: 'Yondr',        color: '#2d5a3d' }, // forest green
  { key: 'lockers',  label: 'Stored in lockers',      short: 'Lockers',      color: '#2b6f8c' }, // teal-blue
  { key: 'staff',    label: 'Collected/stored by staff', short: 'Staff-held', color: '#c8943b' }, // goldenrod
  { key: 'off_away', label: 'Off and away',           short: 'Off & away',   color: '#c2553d' }, // terracotta
  { key: 'mixed',    label: 'Varies by grade/school', short: 'Mixed',        color: '#7b5ea7' }, // muted violet
  { key: 'other',    label: 'Other',                  short: 'Other',        color: '#8a8276' }, // taupe
  { key: 'unknown',  label: 'Not specified',          short: 'Unknown',      color: '#cfc8bb' }, // sand
];

const BY_KEY = Object.fromEntries(STORAGE_METHODS.map((m) => [m.key, m]));

export function methodMeta(key) {
  return BY_KEY[key] || BY_KEY.unknown;
}

export const SECTORS = [
  { key: 'public',   label: 'Public district' },
  { key: 'charter',  label: 'Charter' },
  { key: 'catholic', label: 'Catholic' },
  { key: 'private',  label: 'Private' },
];

export function sectorLabel(key) {
  return (SECTORS.find((s) => s.key === key) || {}).label || key;
}
