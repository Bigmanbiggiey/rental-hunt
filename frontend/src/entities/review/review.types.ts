import type { ISODateTime, UUID } from '@/entities/user';

/**
 * api-design.md §3.1 (Epic 12). Deliberately no reviewer name/avatar —
 * `profiles` has no guest-readable policy, and adding a security-definer
 * view just to expose a reviewer's identity on an otherwise-anonymous
 * feedback signal isn't something any acceptance criterion actually asked
 * for; the UI shows a generic "Verified renter" label instead (still
 * meaningfully more trustworthy than an unverified review, since every row
 * is trigger-derived from a real completed viewing).
 */
export interface Review {
  id: UUID;
  viewingRequestId: UUID;
  agencyId: UUID;
  agentId: UUID | null;
  propertyId: UUID | null;
  rating: number;
  comment: string | null;
  createdAt: ISODateTime;
}

export interface RatingSummary {
  averageRating: number | null;
  reviewCount: number;
}

/**
 * `agencyId`/`agentId`/`propertyId` are deliberately absent — the
 * `enforce_review_eligibility()` trigger derives all three server-side from
 * `viewingRequestId` alone, so nothing trust-relevant is client-suppliable.
 */
export interface CreateReviewInput {
  viewingRequestId: UUID;
  rating: number;
  comment?: string;
}

/** api-design.md §16.2 — offset pagination, same shape as ViewingRequestListMeta. */
export interface ReviewListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ReviewListResult {
  data: Review[];
  meta: ReviewListMeta;
}
