import { Link } from 'react-router';
import { PropertyCard, PropertyCardSkeleton } from '@/entities/property';
import { useFeaturedProperties } from '@/features/property-search';
import { PATHS } from '@/shared/config';

/**
 * DISC-005 — self-contained: fetches its own data via `useFeaturedProperties`
 * rather than receiving it as a prop. Loading -> skeletons; empty/error -> the
 * section renders nothing (a secondary homepage widget silently absent is
 * preferable to an alarming error message on the one page every guest lands
 * on first) rather than nothing at all being handled — both states are
 * explicit branches below, not an unhandled gap.
 */
export function FeaturedListings() {
  const { data: properties, isLoading, isError } = useFeaturedProperties();

  if (isError) return null;
  if (!isLoading && (!properties || properties.length === 0)) return null;

  return (
    <section className="flex flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h2 className="text-h2 font-semibold text-foreground">Featured Properties</h2>
        <Link to={PATHS.public.properties} className="text-body-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading || !properties
          ? Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)
          : properties.map((property) => <PropertyCard key={property.id} property={property} />)}
      </div>
    </section>
  );
}
