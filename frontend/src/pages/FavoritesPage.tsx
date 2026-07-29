import { useState } from 'react';
import { Heart } from 'lucide-react';
import { PropertyCard, PropertyCardSkeleton } from '@/entities/property';
import { useFavoriteIds, useFavorites, useToggleFavorite } from '@/features/favorites';
import { Alert, AlertDescription, Button, EmptyState } from '@/shared/ui';

// FAV-003 — a dedicated page listing every property the customer has saved,
// most recently saved first. Offset pagination (api-design.md §16.2, a
// customer's favorites list is small and bounded) via simple Previous/Next
// controls, not infinite scroll.
function FavoritesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useFavorites(page);
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <h1 className="text-h1 text-foreground font-semibold">Favorites</h1>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <PropertyCardSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            Something went wrong loading your favorites. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && data && data.data.length === 0 && (
        <EmptyState
          icon={Heart}
          heading="No saved properties yet"
          description="Save a property from its listing card or details page to find it here later."
        />
      )}

      {!isLoading && !isError && data && data.data.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.data.map((favorite) => {
              const isSaved = favoriteIds?.has(favorite.propertyId) ?? true;
              return (
                <PropertyCard
                  key={favorite.propertyId}
                  property={favorite.property}
                  favorite={{
                    isSaved,
                    isPending:
                      toggleFavorite.isPending &&
                      toggleFavorite.variables?.propertyId === favorite.propertyId,
                    onToggle: () =>
                      toggleFavorite.mutate({ propertyId: favorite.propertyId, isSaved }),
                  }}
                />
              );
            })}
          </div>

          {data.meta.totalPages > 1 && (
            <div className="mx-auto flex items-center gap-4">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-body-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export { FavoritesPage };
