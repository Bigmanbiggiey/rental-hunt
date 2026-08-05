import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Loader2, Search } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { addOsmTileLayer } from '@/shared/lib/leaflet';

// Kenya's real bounding box — the same values CreatePropertySchema already
// validates latitude/longitude against, so a pin can never land somewhere
// the form would reject anyway.
const KENYA_BOUNDS = L.latLngBounds([-4.9, 33.9], [5.5, 41.9]);
const DEFAULT_ZOOM = 15;

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationPickerMapCanvasProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
}

// The only file that imports `leaflet` for the property form's picker —
// kept out of the eager agent-properties chunk by LocationPickerMap.tsx's
// own React.lazy boundary, mirroring PropertyMap.tsx/PropertyMapCanvas.tsx's
// existing display-only-map split. Driven imperatively, same reasoning as
// that component: one marker, click/drag to move it, no routing.
function LocationPickerMapCanvas({ latitude, longitude, onChange }: LocationPickerMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasTileError, setHasTileError] = useState(false);

  const hasInitialPoint = typeof latitude === 'number' && typeof longitude === 'number' && !Number.isNaN(latitude) && !Number.isNaN(longitude);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current);
    addOsmTileLayer(map, () => setHasTileError(true));
    // Unlike PropertyMapCanvas.tsx's read-only display map, dragging/pinch
    // stay always-on here -- this map IS the form control the agent came to
    // this page to use, so gating pan behind an extra tap would get in the
    // way of its actual job. Only scroll-wheel zoom is disabled by default,
    // since that's a passive hover-driven behavior that can otherwise hijack
    // an agent's scroll through the rest of a long form. Re-enabled on the
    // map's first click, same as the property detail map's activation gate.
    // Found and fixed 2026-08-05 map-rendering review.
    map.scrollWheelZoom.disable();
    map.once('click', () => map.scrollWheelZoom.enable());

    if (hasInitialPoint) {
      map.setView([latitude, longitude], DEFAULT_ZOOM);
      markerRef.current = L.marker([latitude, longitude], { draggable: true }).addTo(map);
    } else {
      // No coordinate yet — show the whole country rather than guessing a
      // default city, so an agent anywhere in Kenya starts from a useful view.
      map.fitBounds(KENYA_BOUNDS);
    }

    function placeMarker(lat: number, lng: number) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current!.getLatLng();
          onChange(pos.lat, pos.lng);
        });
      }
      onChange(lat, lng);
    }

    map.on('click', (e: L.LeafletMouseEvent) => {
      placeMarker(e.latlng.lat, e.latlng.lng);
    });

    if (markerRef.current) {
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng();
        onChange(pos.lat, pos.lng);
      });
    }

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // Intentionally initialized once — subsequent coordinate changes come
    // from this component's own click/drag/search handlers, not from props,
    // so re-running this on every `latitude`/`longitude` change would fight
    // the user's own interaction (recentering the map under their cursor).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setSearchError(null);
    try {
      // Nominatim (OpenStreetMap's free geocoding service) — usage policy
      // caps this at 1 request/second and asks for a real Referer, which
      // fetch() already sends from a browser; no API key. `countrycodes=ke`
      // keeps results relevant to this app's one supported market.
      const url = new URL('https://nominatim.openstreetmap.org/search');
      url.searchParams.set('format', 'json');
      url.searchParams.set('limit', '5');
      url.searchParams.set('countrycodes', 'ke');
      url.searchParams.set('q', trimmed);
      const response = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Search request failed');
      const data = (await response.json()) as NominatimResult[];
      setResults(data);
      if (data.length === 0) setSearchError('No matches found. Try a different search, or click directly on the map.');
    } catch {
      setSearchError('Could not search right now. Try again, or click directly on the map.');
    } finally {
      setIsSearching(false);
    }
  }

  function selectResult(result: NominatimResult) {
    const lat = Number.parseFloat(result.lat);
    const lng = Number.parseFloat(result.lon);
    const map = mapRef.current;
    if (!map) return;

    map.setView([lat, lng], DEFAULT_ZOOM);
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current!.getLatLng();
        onChange(pos.lat, pos.lng);
      });
    }
    onChange(lat, lng);
    setResults([]);
    setQuery(result.display_name);
  }

  // `isolate`: same fix as PropertyMapCanvas.tsx — contains Leaflet's own
  // internal z-index (its zoom control is z-index: 1000) inside this
  // wrapper so it can never outrank an ancestor-level Dialog/Sheet (z-50)
  // regardless of where this form ends up being used.
  return (
    <div className="isolate flex flex-col gap-2">
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an address or place in Kenya…"
          aria-label="Search for a location"
        />
        <Button type="submit" variant="outline" disabled={isSearching}>
          {isSearching ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Search className="size-4" aria-hidden="true" />}
          <span className="sr-only">Search</span>
        </Button>
      </form>

      {searchError && <p className="text-body-sm text-muted-foreground">{searchError}</p>}

      {results.length > 0 && (
        <ul className="border-border divide-border max-h-40 overflow-y-auto rounded-md border divide-y">
          {results.map((result) => (
            <li key={result.place_id}>
              <button
                type="button"
                onClick={() => selectResult(result)}
                className="hover:bg-accent hover:text-accent-foreground text-body-sm w-full px-3 py-2 text-left"
              >
                {result.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        ref={containerRef}
        className="h-64 w-full rounded-lg lg:h-80"
        aria-label="Click or tap anywhere on the map to set this listing's exact location; drag the pin to fine-tune it."
      />
      {hasTileError && (
        <p className="text-body-sm text-muted-foreground">Some map tiles failed to load. Check your connection.</p>
      )}
      <p className="text-body-sm text-muted-foreground">
        Click the map to place a pin, drag it to fine-tune, or search above. Latitude/longitude below update
        automatically — you can also type them in directly.
      </p>
    </div>
  );
}

export { LocationPickerMapCanvas };
