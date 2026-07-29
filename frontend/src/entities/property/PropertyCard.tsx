import { Link } from 'react-router';
import { Bath, BedDouble, MapPin } from 'lucide-react';
import { Badge } from '@/shared/ui';
import { PATHS } from '@/shared/config';
import { cn } from '@/shared/lib/utils';
import { AvailabilityBadge } from './AvailabilityBadge';
import { VerificationBadge } from './VerificationBadge';
import { PriceDisplay } from './PriceDisplay';
import { FavoriteButton } from './FavoriteButton';
import type { Property } from './property.types';

function propertyDetailPath(slug: string): string {
  return PATHS.public.propertyDetail.replace(':slug', slug);
}

export interface PropertyCardFavoriteProps {
  isSaved: boolean;
  isPending: boolean;
  onToggle: () => void;
}

export function PropertyCard({
  property,
  favorite,
}: {
  property: Property;
  favorite: PropertyCardFavoriteProps;
}) {
  const primaryImage = property.images[0];

  return (
    <Link
      to={propertyDetailPath(property.slug)}
      className={cn(
        'group border-border bg-card block overflow-hidden rounded-lg border shadow-sm transition-shadow',
        'focus-visible:ring-ring hover:shadow-md focus-visible:ring-2 focus-visible:outline-none',
        property.availabilityStatus !== 'available' && 'opacity-90',
      )}
    >
      <div className="bg-muted relative aspect-4/3 overflow-hidden">
        {primaryImage ? (
          <img
            src={primaryImage.imageUrl}
            alt={primaryImage.altText ?? property.title}
            loading="lazy"
            className="size-full object-cover"
          />
        ) : null}
        <div className="absolute top-2 left-2 flex gap-1">
          <VerificationBadge status={property.verificationStatus} />
          {/* Only reachable from Favorites/Bookings data — public feeds already exclude archived rows via RLS (FAV-003). */}
          {property.isArchived && <Badge variant="secondary">Archived</Badge>}
        </div>
        <FavoriteButton
          isSaved={favorite.isSaved}
          isPending={favorite.isPending}
          onToggle={favorite.onToggle}
          className="absolute top-2 right-2"
        />
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h4 className="text-h4 text-foreground truncate font-semibold">{property.title}</h4>

        <p className="text-body-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {property.locationName}, {property.countyName}
          </span>
        </p>

        <div className="text-body-sm text-muted-foreground flex items-center gap-3">
          <span className="flex items-center gap-1">
            <BedDouble className="size-4" aria-hidden="true" />
            {property.bedrooms}
          </span>
          <span className="flex items-center gap-1">
            <Bath className="size-4" aria-hidden="true" />
            {property.bathrooms}
          </span>
          <Badge variant="outline">{property.propertyTypeName}</Badge>
        </div>

        <div className="flex items-center justify-between pt-1">
          <PriceDisplay amount={property.rentAmount} currency={property.currency} />
          <AvailabilityBadge status={property.availabilityStatus} />
        </div>
      </div>
    </Link>
  );
}
