import { lazy, Suspense } from 'react';
import { Button, Skeleton } from '@/shared/ui';

const PropertyMapCanvas = lazy(() =>
  import('./PropertyMapCanvas').then((m) => ({ default: m.PropertyMapCanvas })),
);

interface PropertyMapProps {
  latitude: number;
  longitude: number;
  title: string;
}

// PROP-006/SYS-004: the map loads lazily and never blocks the rest of the
// page render — `React.lazy` here is the boundary that keeps `leaflet` out
// of the eager bundle (ui-guidelines.md §12.11: 320px mobile / 400px desktop).
export function PropertyMap({ latitude, longitude, title }: PropertyMapProps) {
  return (
    <div className="flex flex-col gap-3">
      <Suspense fallback={<Skeleton className="h-80 w-full rounded-lg lg:h-[400px]" />}>
        <PropertyMapCanvas latitude={latitude} longitude={longitude} title={title} />
      </Suspense>
      <Button asChild variant="outline" className="self-start">
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Get Directions
        </a>
      </Button>
    </div>
  );
}
