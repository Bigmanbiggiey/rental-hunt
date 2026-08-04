import { Bath, BedDouble, ChevronLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import {
  AgentCard,
  AmenitiesGrid,
  PriceBreakdown,
  PropertyGallery,
  PropertyMap,
  VerificationBadge,
} from '@/entities/property';
import { useAmenities } from '@/features/property-search';
import {
  useSetVerificationStatus,
  useVerificationProperty,
  VerificationActionBar,
} from '@/features/admin-verification';
import { isAppError } from '@/shared/lib/errors';
import { Alert, AlertDescription, Badge, Button, Skeleton } from '@/shared/ui';

/**
 * The developer's own framing: "the point of verification is to verify
 * whatever the agent has entered is correct and accurate information" — so
 * this page shows every field a guest would see on the public listing
 * (gallery, price, location/map, description, amenities, agent), the same
 * order `PropertyDetailPage` already uses (ui-guidelines.md §12.4), with the
 * review decision (`VerificationActionBar`) fixed at the bottom instead of a
 * separate modal. `useVerificationProperty` reads via `getByIdAdmin` — RLS's
 * `properties_select_all_moderator_admin` policy is the real authority, so
 * this works regardless of the listing's status (pending, rejected, etc.),
 * not just `pending_verification`.
 */
function AdminVerificationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: property, isLoading, isError, error } = useVerificationProperty(id ?? '');
  const { data: allAmenities } = useAmenities();
  const { mutate, isPending } = useSetVerificationStatus();

  const backToQueue = () => navigate(-1);

  return (
    <div className="flex flex-col gap-6 pb-24 sm:pb-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={backToQueue}>
        <ChevronLeft className="size-4" aria-hidden="true" />
        Back to queue
      </Button>

      {isLoading && (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-80 w-full rounded-lg lg:h-96" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {isAppError(error) && error.code === 'PROPERTY_NOT_FOUND'
              ? 'This listing could not be found. It may have been removed.'
              : 'Something went wrong loading this listing.'}
          </AlertDescription>
        </Alert>
      )}

      {property && (
        <>
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
              <VerificationBadge status={property.verificationStatus} />
            </div>

            <div className="text-body text-muted-foreground flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1">
                <BedDouble className="size-4" aria-hidden="true" />
                {property.bedrooms} bed{property.bedrooms === 1 ? '' : 's'}
              </span>
              <span className="flex items-center gap-1">
                <Bath className="size-4" aria-hidden="true" />
                {property.bathrooms} bath{property.bathrooms === 1 ? '' : 's'}
              </span>
              <Badge variant="outline">{property.propertyTypeName}</Badge>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-body text-muted-foreground">
              {property.locationName}, {property.countyName}
            </p>
            <PropertyMap latitude={property.latitude} longitude={property.longitude} title={property.title} />
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
            <h2 className="text-h2 text-foreground font-semibold">Submitted by</h2>
            <AgentCard agent={property.agent} />
          </div>

          <VerificationActionBar
            isPending={isPending}
            onSubmit={(input) => {
              mutate(
                { propertyId: property.id, input },
                {
                  onSuccess: () => {
                    toast.success(input.status === 'verified' ? 'Listing approved.' : 'Listing rejected.');
                    backToQueue();
                  },
                  onError: (mutationError) => {
                    toast.error(isAppError(mutationError) ? mutationError.message : 'Something went wrong.');
                  },
                },
              );
            }}
          />
        </>
      )}
    </div>
  );
}

export { AdminVerificationReviewPage };
