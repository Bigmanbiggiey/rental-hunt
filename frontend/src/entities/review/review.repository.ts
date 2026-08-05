import { supabase } from '@/shared/lib/supabase';
import { AppError } from '@/shared/lib/errors/appError';
import { mapSupabaseError } from '@/shared/lib/errors/mapSupabaseError';
import { mapReviewRow, type ReviewRow } from './review.mapper';
import type { CreateReviewInput, RatingSummary, Review, ReviewListResult } from './review.types';

const DEFAULT_PAGE_SIZE = 10;

const REVIEW_COLUMNS = 'id, viewing_request_id, agency_id, agent_id, property_id, rating, comment, created_at';

interface RatingSummaryRow {
  average_rating: string | number | null;
  review_count: number;
}

function mapRatingSummaryRow(row: RatingSummaryRow | null): RatingSummary {
  return {
    averageRating: row?.average_rating == null ? null : Number(row.average_rating),
    reviewCount: row?.review_count ?? 0,
  };
}

async function currentCustomerId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw mapSupabaseError(error);
  if (!data.user) throw new AppError('UNAUTHENTICATED', 'Please sign in to continue.');
  return data.user.id;
}

// api-design.md §13 (Epic 12). `agencyId`/`agentId`/`propertyId` are never
// part of `create()`'s input — `enforce_review_eligibility()` (database.md
// §9) derives them server-side from `viewingRequestId` alone.
export interface ReviewRepository {
  listForAgency(agencyId: string, page?: number, pageSize?: number): Promise<ReviewListResult>;
  listForAgent(agentId: string, page?: number, pageSize?: number): Promise<ReviewListResult>;
  getAgencyRatingSummary(agencyId: string): Promise<RatingSummary>;
  getAgentRatingSummary(agentId: string): Promise<RatingSummary>;
  create(input: CreateReviewInput): Promise<Review>;
}

export const reviewRepository: ReviewRepository = {
  // `.is('deleted_at', null)` is an explicit backstop, not just relying on
  // `reviews_select_all`'s RLS filter — mirrors this project's own
  // documented lesson (database.md §9) that a broader, non-role-restricted
  // policy on the same table (here, `reviews_select_admin`) means an
  // unscoped query can't assume RLS alone narrows it enough for every caller.
  async listForAgency(agencyId, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('reviews')
      .select(REVIEW_COLUMNS, { count: 'exact' })
      .eq('agency_id', agencyId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to)
      .returns<ReviewRow[]>();

    if (error) throw mapSupabaseError(error);
    const total = count ?? 0;
    return {
      data: (data ?? []).map(mapReviewRow),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async listForAgent(agentId, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('reviews')
      .select(REVIEW_COLUMNS, { count: 'exact' })
      .eq('agent_id', agentId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(from, to)
      .returns<ReviewRow[]>();

    if (error) throw mapSupabaseError(error);
    const total = count ?? 0;
    return {
      data: (data ?? []).map(mapReviewRow),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async getAgencyRatingSummary(agencyId) {
    const { data, error } = await supabase
      .from('agency_rating_summary')
      .select('average_rating, review_count')
      .eq('agency_id', agencyId)
      .maybeSingle<RatingSummaryRow>();

    if (error) throw mapSupabaseError(error);
    return mapRatingSummaryRow(data);
  },

  async getAgentRatingSummary(agentId) {
    const { data, error } = await supabase
      .from('agent_rating_summary')
      .select('average_rating, review_count')
      .eq('agent_id', agentId)
      .maybeSingle<RatingSummaryRow>();

    if (error) throw mapSupabaseError(error);
    return mapRatingSummaryRow(data);
  },

  async create(input) {
    const customerId = await currentCustomerId();

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        customer_id: customerId,
        viewing_request_id: input.viewingRequestId,
        rating: input.rating,
        comment: input.comment ?? null,
      })
      .select(REVIEW_COLUMNS)
      .single<ReviewRow>();

    if (error) throw mapSupabaseError(error);
    return mapReviewRow(data);
  },
};
