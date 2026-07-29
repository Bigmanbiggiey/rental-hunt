import { PropertyCard, PropertyCardSkeleton } from '@/entities/property';
import { EmptySearchResults, useProperties } from '@/features/property-search';
import type { PropertyFiltersRawInput } from '@/features/property-search';
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites';
import { Alert, AlertDescription, Button } from '@/shared/ui';

interface PropertyGridProps {
  rawFilters: PropertyFiltersRawInput;
  onClearFilters: () => void;
}

/**
 * DISC-001/003/004/006 — owns the actual `useProperties` call (the page just
 * passes the URL-derived filter object down), rendering every async state
 * explicitly: loading skeletons, the real grid, DISC-006's empty state, an
 * error Alert, and an explicit "Load more" button (`ui-guidelines.md` §11.16
 * — infinite scroll backed by keyset pagination, not silent scroll-trigger,
 * since the spec doesn't pin the trigger mechanism down and an explicit
 * button is more accessible).
 */
export function PropertyGrid({ rawFilters, onClearFilters }: PropertyGridProps) {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProperties(rawFilters);
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <PropertyCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Something went wrong on our end. Please try again in a moment.
        </AlertDescription>
      </Alert>
    );
  }

  const properties = data?.pages.flatMap((page) => page.data) ?? [];

  if (properties.length === 0) {
    return <EmptySearchResults onClearFilters={onClearFilters} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {properties.map((property) => {
          const isSaved = favoriteIds?.has(property.id) ?? false;
          return (
            <PropertyCard
              key={property.id}
              property={property}
              favorite={{
                isSaved,
                isPending:
                  toggleFavorite.isPending && toggleFavorite.variables?.propertyId === property.id,
                onToggle: () => toggleFavorite.mutate({ propertyId: property.id, isSaved }),
              }}
            />
          );
        })}
      </div>

      {hasNextPage && (
        <Button
          variant="outline"
          onClick={() => void fetchNextPage()}
          isLoading={isFetchingNextPage}
          className="mx-auto"
        >
          Load more
        </Button>
      )}
    </div>
  );
}
