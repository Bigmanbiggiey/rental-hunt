import { useState } from 'react';
import { ImageGalleryViewer } from './ImageGalleryViewer';
import type { PropertyImage } from './property.types';

interface PropertyGalleryProps {
  images: PropertyImage[];
  propertyTitle: string;
}

const MAX_DESKTOP_THUMBNAILS = 4;

// PROP-002 (ui-guidelines.md §12.2). Desktop: hero + 2x2 thumbnail grid with
// a "+N photos" overlay. Mobile: a horizontally scrolling row using CSS
// scroll-snap (not a JS carousel) with visible prev/next buttons — §12.2
// requires the carousel be operable without gestures.
export function PropertyGallery({ images, propertyTitle }: PropertyGalleryProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  if (images.length === 0) return null;

  const openAt = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const [hero, ...rest] = images;
  const thumbnails = rest.slice(0, MAX_DESKTOP_THUMBNAILS);
  const extraCount = images.length - 1 - MAX_DESKTOP_THUMBNAILS;

  return (
    <>
      {/* Mobile: scroll-snap row */}
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto sm:hidden" role="group" aria-label="Property photos">
        {images.map((image, i) => (
          <button
            key={image.id}
            type="button"
            onClick={() => openAt(i)}
            className="aspect-4/3 w-[85vw] shrink-0 snap-center overflow-hidden rounded-lg"
          >
            <img src={image.imageUrl} alt={image.altText ?? propertyTitle} className="size-full object-cover" />
          </button>
        ))}
      </div>

      {/* Desktop: hero + 2x2 grid */}
      <div className="hidden gap-2 sm:grid sm:grid-cols-3 sm:grid-rows-2">
        {hero && (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="col-span-2 row-span-2 overflow-hidden rounded-lg"
          >
            <img
              src={hero.imageUrl}
              alt={hero.altText ?? propertyTitle}
              className="size-full object-cover"
            />
          </button>
        )}
        {thumbnails.map((image, i) => {
          const isLast = i === thumbnails.length - 1;
          return (
            <button
              key={image.id}
              type="button"
              onClick={() => openAt(i + 1)}
              className="relative overflow-hidden rounded-lg"
            >
              <img
                src={image.imageUrl}
                alt={image.altText ?? propertyTitle}
                className="size-full object-cover"
              />
              {isLast && extraCount > 0 && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-body font-semibold text-white">
                  +{extraCount} photos
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ImageGalleryViewer
        images={images}
        initialIndex={viewerIndex}
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        propertyTitle={propertyTitle}
      />
    </>
  );
}
