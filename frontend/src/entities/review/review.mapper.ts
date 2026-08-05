import type { Review } from './review.types';

/** Shape of a raw `public.reviews` row (database.md §5.x, Epic 12), snake_case as PostgREST returns it. */
export interface ReviewRow {
  id: string;
  viewing_request_id: string;
  agency_id: string;
  agent_id: string | null;
  property_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function mapReviewRow(row: ReviewRow): Review {
  return {
    id: row.id,
    viewingRequestId: row.viewing_request_id,
    agencyId: row.agency_id,
    agentId: row.agent_id,
    propertyId: row.property_id,
    rating: row.rating,
    comment: row.comment,
    createdAt: row.created_at,
  };
}
