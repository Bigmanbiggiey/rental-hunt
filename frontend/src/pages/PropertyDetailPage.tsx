import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AgentCard,
  AmenitiesGrid,
  AvailabilityBadge,
  FavoriteButton,
  PriceBreakdown,
  PropertyGallery,
  PropertyMap,
  ShareButton,
  VerificationBadge,
  ViewingCTA,
} from '@/entities/property';
import { useAmenities } from '@/features/property-search';
import { useProperty } from '@/features/property-details';
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites';
import { BookingRequestDialog } from '@/features/viewing-requests';
import { useAuth } from '@/entities/user';
import { RelatedProperties } from '@/widgets';
import { Alert, AlertDescription, Skeleton } from '@/shared/ui';
import { isAppError } from '@/shared/lib/errors';
import { PATHS } from '@/shared/config';

// PROP-001..006. Owns the single `useProperty(slug)` call; every rendered
// field traces to a real `Property` field (the sprint's own DoD line) — no
// placeholder/fabricated data.
function PropertyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { data: property, isLoading, isError, error } = useProperty(slug ?? '');
  const { data: allAmenities } = useAmenities();
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();
  const [bookingOpen, setBookingOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-80 w-full rounded-lg lg:h-96" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !property) {
    const message =
      isAppError(error) && error.code === 'PROPERTY_NOT_FOUND'
        ? 'This property could not be found. It may have been removed.'
        : 'Something went wrong loading this property. Please try again.';
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const isSaved = favoriteIds?.has(property.id) ?? false;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
      <PropertyGallery images={property.images} propertyTitle={property.title} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-h1 text-foreground font-semibold">{property.title}</h1>
            <PriceBreakdown
              rentAmount={property.rentAmount}
              depositAmount={property.depositAmount}
              currency={property.currency}
            />
          </div>
          <div className="flex items-center gap-2">
            <AvailabilityBadge status={property.availabilityStatus} />
            <FavoriteButton
              isSaved={isSaved}
              isPending={toggleFavorite.isPending}
              onToggle={() => toggleFavorite.mutate({ propertyId: property.id, isSaved })}
            />
            <ShareButton title={property.title} url={shareUrl} />
          </div>
        </div>
      </div>

      <ViewingCTA
        availabilityStatus={property.availabilityStatus}
        onBook={() => (profile ? setBookingOpen(true) : navigate(PATHS.public.login))}
      />

      <div className="flex flex-col gap-3">
        <p className="text-body text-muted-foreground">
          {property.locationName}, {property.countyName}
        </p>
        <PropertyMap
          latitude={property.latitude}
          longitude={property.longitude}
          title={property.title}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-h2 text-foreground font-semibold">Description</h2>
        <p className="text-body text-foreground whitespace-pre-line">{property.description}</p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-h2 text-foreground font-semibold">Amenities</h2>
        <AmenitiesGrid available={property.amenities} all={allAmenities ?? property.amenities} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-h2 text-foreground font-semibold">Managed By</h2>
        <AgentCard agent={property.agent} />
      </div>

      <div className="flex items-center gap-2">
        <VerificationBadge status={property.verificationStatus} />
        {property.verificationStatus === 'verified' && property.lastVerifiedAt && (
          <span className="text-body-sm text-muted-foreground">
            Last verified {new Date(property.lastVerifiedAt).toLocaleDateString('en-KE')}
          </span>
        )}
      </div>

      <RelatedProperties property={property} />

      <BookingRequestDialog open={bookingOpen} onOpenChange={setBookingOpen} property={property} />
    </div>
  );
}

export { PropertyDetailPage };
