import { PropertyCard, PropertyCardSkeleton, type Property } from '@/entities/property';
import { useRelatedProperties } from '@/features/property-details';

/**
 * PROP-001's "related/similar properties" section — self-contained, mirrors
 * `FeaturedListings`' shape exactly: a secondary section failing quietly
 * (null on error/empty) beats an alarming error on the primary detail page.
 */
export function RelatedProperties({ property }: { property: Property }) {
  const { data: related, isLoading, isError } = useRelatedProperties(property);

  if (isError) return null;
  if (!isLoading && (!related || related.length === 0)) return null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2 font-semibold text-foreground">Similar Properties</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !related
          ? Array.from({ length: 4 }).map((_, i) => <PropertyCardSkeleton key={i} />)
          : related.map((p) => <PropertyCard key={p.id} property={p} />)}
      </div>
    </section>
  );
}
