import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/shared/ui';
import type { PropertyImage } from './property.types';

interface ImageGalleryViewerProps {
  images: PropertyImage[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyTitle: string;
}

// PROP-002's full-screen viewer (ui-guidelines.md §12.3). Built on the
// existing Sheet/Radix Dialog primitive rather than a carousel dependency —
// Radix already provides focus-trap and Esc-to-close for free. `!`-prefixed
// classes force full-viewport sizing over Sheet's own side-drawer variant
// classes, since `cn()`'s tailwind-merge can't reliably cancel a `side`
// variant's edge/width utilities with plain override classes.
export function ImageGalleryViewer({
  images,
  initialIndex,
  open,
  onOpenChange,
  propertyTitle,
}: ImageGalleryViewerProps) {
  const [index, setIndex] = useState(initialIndex);

  const current = images[index];
  const goPrev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const goNext = () => setIndex((i) => (i + 1) % images.length);

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setIndex(initialIndex);
      }}
    >
      <SheetContent
        side="right"
        className="!inset-0 !h-screen !w-screen !max-w-none !border-0 !bg-black/95 !p-0"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') goPrev();
          if (event.key === 'ArrowRight') goNext();
        }}
      >
        <SheetTitle className="sr-only">{propertyTitle} photos</SheetTitle>
        <div className="flex h-full flex-col items-center justify-center gap-4 p-4">
          {current && (
            <img
              src={current.imageUrl}
              alt={current.altText ?? propertyTitle}
              className="max-h-[80vh] max-w-full object-contain"
            />
          )}
          <p aria-live="polite" className="text-body-sm text-white">
            {current?.altText ?? propertyTitle} — {index + 1} / {images.length}
          </p>
          {images.length > 1 && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous photo"
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="size-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next photo"
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronRight className="size-6" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
