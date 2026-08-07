import { useState } from 'react';
import { useParams } from 'react-router';
import { Globe, Link2, MessageSquare } from 'lucide-react';
import {
  useAgency,
  useAgencyAgents,
  useAgencyProperties,
  useAgencyRatingSummary,
  useAgencyReviews,
  useAgentRatingSummary,
} from '@/features/agency-profile';
import { useFavoriteIds, useToggleFavorite } from '@/features/favorites';
import { PropertyCard, PropertyCardSkeleton } from '@/entities/property';
import { Alert, AlertDescription, Avatar, AvatarFallback, Button, EmptyState, Rating, Skeleton } from '@/shared/ui';
import { isHttpUrl } from '@/shared/lib';
import { NotFoundPage } from './NotFoundPage';

const REVIEWS_PAGE_SIZE = 10;

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-KE', { dateStyle: 'medium' });
}

// This version of lucide-react ships no brand/trademark icons (Facebook,
// Instagram, Twitter, LinkedIn, etc. all removed) — `Link2` stands in for
// every platform except Website, distinguished by its aria-label/text, not
// a per-brand icon.
const SOCIAL_ICONS = [
  { key: 'website', icon: Globe, label: 'Website' },
  { key: 'facebook', icon: Link2, label: 'Facebook' },
  { key: 'instagram', icon: Link2, label: 'Instagram' },
  { key: 'twitter', icon: Link2, label: 'Twitter / X' },
  { key: 'linkedin', icon: Link2, label: 'LinkedIn' },
] as const;

/** Epic 12's public Agency Profile Page — properties/agents/reviews under one agency, each with its own rating. */
function AgencyDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [reviewsPage, setReviewsPage] = useState(1);

  const { data: agency, isLoading: isAgencyLoading, isError: isAgencyError } = useAgency(slug ?? '');
  const propertiesQuery = useAgencyProperties(agency?.id ?? '');
  const { data: agents, isLoading: isAgentsLoading } = useAgencyAgents(agency?.id ?? '');
  const { data: ratingSummary } = useAgencyRatingSummary(agency?.id ?? '');
  const { data: reviews, isLoading: isReviewsLoading } = useAgencyReviews(agency?.id ?? '', reviewsPage, REVIEWS_PAGE_SIZE);
  const { data: favoriteIds } = useFavoriteIds();
  const toggleFavorite = useToggleFavorite();

  if (isAgencyLoading) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isAgencyError || !agency) {
    return <NotFoundPage />;
  }

  const properties = propertiesQuery.data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Avatar className="size-16">
            {agency.logoUrl && isHttpUrl(agency.logoUrl) ? (
              <img src={agency.logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <AvatarFallback>{initials(agency.name)}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col gap-1">
            <h1 className="text-h1 text-foreground font-semibold">{agency.name}</h1>
            <Rating averageRating={ratingSummary?.averageRating ?? null} reviewCount={ratingSummary?.reviewCount ?? 0} />
            {agency.description && <p className="text-body text-muted-foreground max-w-prose">{agency.description}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-2 text-right sm:text-left">
          {agency.phone && <p className="text-body-sm text-muted-foreground">{agency.phone}</p>}
          {agency.email && <p className="text-body-sm text-muted-foreground">{agency.email}</p>}
          <div className="flex items-center gap-2 sm:justify-start">
            {SOCIAL_ICONS.filter(({ key }) => {
              const url = agency.socialLinks[key];
              return url && isHttpUrl(url);
            }).map(({ key, icon: Icon, label }) => (
              <a
                key={key}
                href={agency.socialLinks[key]}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-foreground focus-visible:ring-ring rounded-md p-1 focus-visible:ring-2 focus-visible:outline-none"
              >
                <Icon className="size-5" aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 text-foreground font-semibold">Agents</h2>
        {isAgentsLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        )}
        {agents && agents.length === 0 && <p className="text-body-sm text-muted-foreground">No agents listed yet.</p>}
        {agents && agents.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <AgentSummaryCard key={agent.agentId} agentId={agent.agentId} fullName={agent.fullName} jobTitle={agent.jobTitle} />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 text-foreground font-semibold">Properties</h2>
        {propertiesQuery.isError && (
          <Alert variant="destructive">
            <AlertDescription>Something went wrong loading this agency's properties.</AlertDescription>
          </Alert>
        )}
        {!propertiesQuery.isLoading && properties.length === 0 && (
          <p className="text-body-sm text-muted-foreground">No active listings right now.</p>
        )}
        {(propertiesQuery.isLoading || properties.length > 0) && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {propertiesQuery.isLoading
              ? Array.from({ length: 3 }).map((_, i) => <PropertyCardSkeleton key={i} />)
              : properties.map((property) => {
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
        )}
        {propertiesQuery.hasNextPage && (
          <Button
            variant="outline"
            className="self-center"
            isLoading={propertiesQuery.isFetchingNextPage}
            onClick={() => void propertiesQuery.fetchNextPage()}
          >
            Load more
          </Button>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 text-foreground font-semibold">Reviews</h2>

        {isReviewsLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        )}

        {reviews && reviews.data.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            heading="No reviews yet"
            description="Reviews appear here once customers complete a viewing."
          />
        )}

        {reviews && reviews.data.length > 0 && (
          <>
            <ul className="flex flex-col gap-3">
              {reviews.data.map((review) => (
                <li key={review.id} className="border-border rounded-lg border p-4">
                  <div className="flex items-center justify-between gap-2">
                    <Rating averageRating={review.rating} reviewCount={1} />
                    <span className="text-body-sm text-muted-foreground">{formatDate(review.createdAt)}</span>
                  </div>
                  {review.comment && <p className="text-body-sm text-foreground mt-2">{review.comment}</p>}
                  <p className="text-body-sm text-muted-foreground mt-1">Verified renter</p>
                </li>
              ))}
            </ul>

            {reviews.meta.totalPages > 1 && (
              <div className="mx-auto flex items-center gap-4">
                <Button
                  variant="outline"
                  disabled={reviewsPage <= 1}
                  onClick={() => setReviewsPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-body-sm text-muted-foreground">
                  Page {reviews.meta.page} of {reviews.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={reviewsPage >= reviews.meta.totalPages}
                  onClick={() => setReviewsPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function AgentSummaryCard({ agentId, fullName, jobTitle }: { agentId: string; fullName: string; jobTitle: string | null }) {
  const { data: ratingSummary } = useAgentRatingSummary(agentId);

  return (
    <div className="border-border flex items-center gap-3 rounded-lg border p-4">
      <Avatar>
        <AvatarFallback>{initials(fullName)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-1">
        <p className="text-body font-medium">{fullName}</p>
        {jobTitle && <p className="text-body-sm text-muted-foreground">{jobTitle}</p>}
        <Rating averageRating={ratingSummary?.averageRating ?? null} reviewCount={ratingSummary?.reviewCount ?? 0} />
      </div>
    </div>
  );
}

export { AgencyDetailPage };
