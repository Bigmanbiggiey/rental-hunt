import { lazy, Suspense } from 'react';
import { Skeleton } from '@/shared/ui';

const LocationPickerMapCanvas = lazy(() =>
  import('./LocationPickerMapCanvas').then((m) => ({ default: m.LocationPickerMapCanvas })),
);

interface LocationPickerMapProps {
  latitude?: number;
  longitude?: number;
  onChange: (lat: number, lng: number) => void;
}

// Mirrors entities/property/PropertyMap.tsx's split exactly — this
// React.lazy boundary is what keeps `leaflet` out of the eager
// agent-properties chunk (SYS-004's reasoning applies here too, even
// though this is a form control, not a read-only display map).
export function LocationPickerMap(props: LocationPickerMapProps) {
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg lg:h-80" />}>
      <LocationPickerMapCanvas {...props} />
    </Suspense>
  );
}
