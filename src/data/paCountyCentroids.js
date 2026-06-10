/**
 * Approximate geographic centroids for all 67 PA counties.
 * [lng, lat] — used to project county bubbles onto the SVG map.
 * Bounding box: lng [-80.52, -74.69], lat [39.72, 42.27]
 */
export const PA_COUNTIES = [
  { name: 'Adams', lng: -77.22, lat: 39.87 },
  { name: 'Allegheny', lng: -80.01, lat: 40.47 },
  { name: 'Armstrong', lng: -79.47, lat: 40.81 },
  { name: 'Beaver', lng: -80.35, lat: 40.69 },
  { name: 'Bedford', lng: -78.49, lat: 40.01 },
  { name: 'Berks', lng: -75.92, lat: 40.42 },
  { name: 'Blair', lng: -78.35, lat: 40.48 },
  { name: 'Bradford', lng: -76.53, lat: 41.79 },
  { name: 'Bucks', lng: -75.07, lat: 40.34 },
  { name: 'Butler', lng: -79.90, lat: 40.93 },
  { name: 'Cambria', lng: -78.72, lat: 40.50 },
  { name: 'Cameron', lng: -78.18, lat: 41.42 },
  { name: 'Carbon', lng: -75.71, lat: 40.92 },
  { name: 'Centre', lng: -77.78, lat: 40.92 },
  { name: 'Chester', lng: -75.74, lat: 39.98 },
  { name: 'Clarion', lng: -79.44, lat: 41.20 },
  { name: 'Clearfield', lng: -78.48, lat: 41.00 },
  { name: 'Clinton', lng: -77.52, lat: 41.22 },
  { name: 'Columbia', lng: -76.43, lat: 41.05 },
  { name: 'Crawford', lng: -80.10, lat: 41.68 },
  { name: 'Cumberland', lng: -77.26, lat: 40.17 },
  { name: 'Dauphin', lng: -76.79, lat: 40.37 },
  { name: 'Delaware', lng: -75.38, lat: 39.92 },
  { name: 'Elk', lng: -78.65, lat: 41.43 },
  { name: 'Erie', lng: -80.08, lat: 42.12 },
  { name: 'Fayette', lng: -79.63, lat: 39.92 },
  { name: 'Forest', lng: -79.25, lat: 41.51 },
  { name: 'Franklin', lng: -77.74, lat: 40.00 },
  { name: 'Fulton', lng: -78.11, lat: 39.93 },
  { name: 'Greene', lng: -80.22, lat: 39.86 },
  { name: 'Huntingdon', lng: -77.98, lat: 40.48 },
  { name: 'Indiana', lng: -79.10, lat: 40.62 },
  { name: 'Jefferson', lng: -78.99, lat: 41.13 },
  { name: 'Juniata', lng: -77.41, lat: 40.53 },
  { name: 'Lackawanna', lng: -75.60, lat: 41.44 },
  { name: 'Lancaster', lng: -76.31, lat: 40.05 },
  { name: 'Lawrence', lng: -80.34, lat: 40.99 },
  { name: 'Lebanon', lng: -76.48, lat: 40.38 },
  { name: 'Lehigh', lng: -75.50, lat: 40.61 },
  { name: 'Luzerne', lng: -75.90, lat: 41.17 },
  { name: 'Lycoming', lng: -77.10, lat: 41.34 },
  { name: 'McKean', lng: -78.55, lat: 41.80 },
  { name: 'Mercer', lng: -80.24, lat: 41.30 },
  { name: 'Mifflin', lng: -77.62, lat: 40.61 },
  { name: 'Monroe', lng: -75.34, lat: 41.06 },
  { name: 'Montgomery', lng: -75.37, lat: 40.22 },
  { name: 'Montour', lng: -76.64, lat: 41.01 },
  { name: 'Northampton', lng: -75.31, lat: 40.75 },
  { name: 'Northumberland', lng: -76.72, lat: 40.87 },
  { name: 'Perry', lng: -77.26, lat: 40.40 },
  { name: 'Philadelphia', lng: -75.13, lat: 40.00 },
  { name: 'Pike', lng: -74.99, lat: 41.33 },
  { name: 'Potter', lng: -77.89, lat: 41.74 },
  { name: 'Schuylkill', lng: -76.19, lat: 40.70 },
  { name: 'Snyder', lng: -77.06, lat: 40.77 },
  { name: 'Somerset', lng: -79.04, lat: 40.00 },
  { name: 'Sullivan', lng: -76.50, lat: 41.44 },
  { name: 'Susquehanna', lng: -75.80, lat: 41.85 },
  { name: 'Tioga', lng: -77.10, lat: 41.77 },
  { name: 'Union', lng: -77.07, lat: 40.97 },
  { name: 'Venango', lng: -79.69, lat: 41.40 },
  { name: 'Warren', lng: -79.23, lat: 41.84 },
  { name: 'Washington', lng: -80.24, lat: 40.21 },
  { name: 'Wayne', lng: -75.24, lat: 41.66 },
  { name: 'Westmoreland', lng: -79.43, lat: 40.31 },
  { name: 'Wyoming', lng: -75.87, lat: 41.55 },
  { name: 'York', lng: -76.73, lat: 40.01 },
];

// PA bounding box
export const PA_BOUNDS = {
  minLng: -80.52,
  maxLng: -74.69,
  minLat: 39.72,
  maxLat: 42.27,
};

/** Project [lng, lat] to SVG [x, y] within a given width/height */
export function project(lng, lat, width, height) {
  const x = ((lng - PA_BOUNDS.minLng) / (PA_BOUNDS.maxLng - PA_BOUNDS.minLng)) * width;
  const y = ((PA_BOUNDS.maxLat - lat) / (PA_BOUNDS.maxLat - PA_BOUNDS.minLat)) * height;
  return { x, y };
}
