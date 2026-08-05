import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './leaflet-overrides.css';

// Leaflet's default marker icon URLs are relative to its own package path,
// which breaks under Vite's bundling -- re-pointed to the CDN-hosted assets,
// the standard workaround for this well-known Leaflet+bundler issue. Runs
// once per page load: both map canvases import this shared module instead
// of each declaring their own copy of this fix (found duplicated 2026-08-05).
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function addOsmTileLayer(map: L.Map, onTileError: () => void): L.TileLayer {
  const tileLayer = L.tileLayer(OSM_TILE_URL, { attribution: OSM_ATTRIBUTION }).addTo(map);
  tileLayer.on('tileerror', onTileError);
  return tileLayer;
}
