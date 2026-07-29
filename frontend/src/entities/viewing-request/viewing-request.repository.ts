import { supabase } from '@/shared/lib/supabase';
import { AppError, mapSupabaseError } from '@/shared/lib/errors';
import { mapViewingRequestRow, type ViewingRequestRow } from './viewing-request.mapper';
import type {
  CreateViewingRequestInput,
  ListViewingRequestsInput,
  ViewingRequest,
  ViewingRequestListResult,
  ViewingRequestSort,
} from './viewing-request.types';

// api-design.md §8.2/§8.3's underlying-call shape. Only `create`/`cancel`/
// `listForCustomer` are declared this sprint (customer-side, VIEW-001..005);
// Sprint 6 extends this same interface in place with the agent-side
// `listForAgent`/`confirm`/`reschedule`/`complete`/`markNoShow` methods,
// exactly how `getBySlug` was added to `PropertyRepository` in Sprint 4 —
// this repository lives in `entities/` (ADR-027), not `features/`, because
// its reads are genuinely cross-cutting across both sprints.
export interface ViewingRequestRepository {
  create(input: CreateViewingRequestInput): Promise<ViewingRequest>;
  cancel(id: string, reason?: string): Promise<ViewingRequest>;
  listForCustomer(input?: ListViewingRequestsInput): Promise<ViewingRequestListResult>;
}

const VIEWING_REQUEST_COLUMNS = `
  id, customer_id, property_id, agent_id, requested_date, requested_time,
  status, notes, cancellation_reason, created_at, updated_at,
  property:properties(id, slug, title, images:property_images(id, image_url, alt_text, display_order))
`;

const DEFAULT_PAGE_SIZE = 20;

function sortColumn(sort: ViewingRequestSort): 'requested_date' | 'created_at' {
  return sort === 'createdAtDesc' ? 'created_at' : 'requested_date';
}

function sortAscending(sort: ViewingRequestSort): boolean {
  return sort === 'requestedDateAsc';
}

async function currentCustomerId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw mapSupabaseError(error);
  if (!data.user) throw new AppError('UNAUTHENTICATED', 'Please sign in to continue.');
  return data.user.id;
}

export const viewingRequestRepository: ViewingRequestRepository = {
  // The `prevent_booking_unavailable_property()` trigger (database.md §9) is
  // the real backstop here — the Service layer checks availability first for
  // a good UX, but this call can still fail the trigger under a race.
  async create(input) {
    const customerId = await currentCustomerId();

    const { data, error } = await supabase
      .from('viewing_requests')
      .insert({
        customer_id: customerId,
        property_id: input.propertyId,
        agent_id: input.agentId,
        requested_date: input.requestedDate,
        requested_time: input.requestedTime,
        notes: input.notes ?? null,
      })
      .select(VIEWING_REQUEST_COLUMNS)
      .single<ViewingRequestRow>();

    if (error) throw mapSupabaseError(error);
    return mapViewingRequestRow(data);
  },

  // RLS's `viewing_requests_cancel_own_customer` policy already restricts
  // this to the caller's own pending/confirmed rows — 0 rows matched (not
  // theirs, or already terminal) surfaces as PGRST116, mapped to
  // INVALID_STATE_TRANSITION rather than a not-found: the UI only ever shows
  // Cancel on a request the customer can already see, so a real hit here is
  // stale state, not an ownership violation (api-design.md §15.3).
  async cancel(id, reason) {
    const { data, error } = await supabase
      .from('viewing_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason ?? null,
      })
      .eq('id', id)
      .select(VIEWING_REQUEST_COLUMNS)
      .single<ViewingRequestRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'INVALID_STATE_TRANSITION' });
    return mapViewingRequestRow(data);
  },

  // RLS's `viewing_requests_select_own_customer` policy already scopes this
  // to the caller's own rows; no explicit `.eq('customer_id', ...)` needed.
  async listForCustomer(input = {}) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
    const sort = input.sort ?? 'createdAtDesc';
    const column = sortColumn(sort);
    const ascending = sortAscending(sort);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('viewing_requests')
      .select(VIEWING_REQUEST_COLUMNS, { count: 'exact' })
      .order(column, { ascending })
      .range(from, to);

    if (input.status && input.status.length > 0) {
      query = query.in('status', input.status);
    }

    const { data, error, count } = await query.returns<ViewingRequestRow[]>();
    if (error) throw mapSupabaseError(error);

    const total = count ?? 0;
    return {
      data: (data ?? []).map(mapViewingRequestRow),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },
};
