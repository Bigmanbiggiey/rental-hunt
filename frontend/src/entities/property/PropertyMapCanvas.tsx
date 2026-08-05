import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { addOsmTileLayer } from '@/shared/lib/leaflet';

interface PropertyMapCanvasProps {
  latitude: number;
  longitude: number;
  title: string;
}

// The only file (besides LocationPickerMapCanvas.tsx) that imports
// `leaflet` -- kept out of the eager bundle by `PropertyMap.tsx`'s
// `React.lazy` boundary (architecture.md §14, SYS-004). Driven imperatively
// (no react-leaflet) since a single fixed marker with no routing doesn't
// need a second dependency's own React-19 peer-compat story.
function PropertyMapCanvas({ latitude, longitude, title }: PropertyMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isActivated, setIsActivated] = useState(false);
  const [hasTileError, setHasTileError] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    setIsActivated(false);
    setHasTileError(false);

    const map = L.map(containerRef.current).setView([latitude, longitude], 15);
    addOsmTileLayer(map, () => setHasTileError(true));
    markerRef.current = L.marker([latitude, longitude]).addTo(map).bindPopup(title);

    // This map sits mid-page, not full-viewport, so Leaflet's default
    // drag/scroll-zoom traps a user's vertical swipe or mouse-wheel page
    // scroll the moment it starts over the map -- a well-known issue for
    // any embedded (non-fullscreen) map. Gated behind a single tap/click;
    // the zoom +/- control stays always-active regardless (Leaflet's
    // control buttons stop their own click from reaching this handler),
    // matching Google Maps' own "cooperative gesture handling" convention.
    // Found and fixed 2026-08-05 map-rendering review.
    map.dragging.disable();
    map.touchZoom.disable();
    map.scrollWheelZoom.disable();
    map.once('click', () => {
      map.dragging.enable();
      map.touchZoom.enable();
      map.scrollWheelZoom.enable();
      setIsActivated(true);
    });

    return () => {
      map.remove();
      markerRef.current = null;
    };
    // Intentionally scoped to lat/lng only -- see the separate effect below
    // for `title`, which shouldn't tear down and rebuild the whole map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  // Keeps the popup text in sync without recreating the whole map on a
  // title-only change (found 2026-08-05 map-rendering review -- the
  // previous version depended on `title` too, rebuilding Leaflet's entire
  // tile/marker/event setup for a change that only ever needs new popup
  // text).
  useEffect(() => {
    markerRef.current?.setPopupContent(title);
  }, [title]);

  // No `role="img"` -- Leaflet renders real interactive controls (zoom
  // buttons, a draggable map, a marker popup) inside; an "img" role would
  // tell assistive tech to collapse all of that into one opaque image.
  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-80 w-full rounded-lg lg:h-[400px]"
        aria-label={`Map showing the location of ${title}`}
      />
      {!isActivated && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="bg-background/90 text-foreground text-body-sm rounded-full px-3 py-1.5 shadow">
            Tap to interact with map
          </span>
        </div>
      )}
      {hasTileError && (
        <p className="text-body-sm text-muted-foreground mt-2">
          Some map tiles failed to load. Check your connection.
        </p>
      )}
    </div>
  );
}

export { PropertyMapCanvas };
