import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icon URLs are relative to its own package path,
// which breaks under Vite's bundling — re-pointed to the CDN-hosted assets,
// the standard workaround for this well-known Leaflet+bundler issue.
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface PropertyMapCanvasProps {
  latitude: number;
  longitude: number;
  title: string;
}

// The only file that imports `leaflet` — kept out of the eager bundle by
// `PropertyMap.tsx`'s `React.lazy` boundary (architecture.md §14, SYS-004).
// Driven imperatively (no react-leaflet) since a single fixed marker with no
// routing doesn't need a second dependency's own React-19 peer-compat story.
function PropertyMapCanvas({ latitude, longitude, title }: PropertyMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current).setView([latitude, longitude], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.marker([latitude, longitude]).addTo(map).bindPopup(title);

    return () => {
      map.remove();
    };
  }, [latitude, longitude, title]);

  // No `role="img"` — Leaflet renders real interactive controls (zoom
  // buttons, a draggable map, a marker popup) inside; an "img" role would
  // tell assistive tech to collapse all of that into one opaque image.
  return (
    <div
      ref={containerRef}
      className="h-80 w-full rounded-lg lg:h-[400px]"
      aria-label={`Map showing the location of ${title}`}
    />
  );
}

export { PropertyMapCanvas };
