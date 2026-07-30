import { supabase } from '@/shared/lib/supabase';
import { AppError, mapSupabaseError } from '@/shared/lib/errors';
import { mapViewingRequestRow, type ViewingRequestRow } from './viewing-request.mapper';
import type {
  CreateViewingRequestInput,
  ListViewingRequestsInput,
  RescheduleViewingRequestInput,
  ViewingRequest,
  ViewingRequestListResult,
  ViewingRequestSort,
} from './viewing-request.types';

// api-design.md §8.2–§8.9's underlying-call shape. `create`/`cancel`/
// `listForCustomer` shipped Sprint 5 (customer-side, VIEW-001..005); Sprint 6
// extends this same interface in place with the agent-side
// `listForAgent`/`confirm`/`reschedule`/`complete`/`markNoShow` methods,
// exactly how `getBySlug` was added to `PropertyRepository` in Sprint 4 —
// this repository lives in `entities/` (ADR-027), not `features/`, because
// its reads are genuinely cross-cutting across both sprints.
export interface ViewingRequestRepository {
  create(input: CreateViewingRequestInput): Promise<ViewingRequest>;
  /** VIEW-004/BOOK-004, both actors — see the guard note on the implementation below. */
  cancel(id: string, reason?: string): Promise<ViewingRequest>;
  listForCustomer(input?: ListViewingRequestsInput): Promise<ViewingRequestListResult>;
  /** BOOK-001. RLS's `viewing_requests_select_agent_own` policy already scopes this to the caller's own `agent_id` rows — no explicit filter needed here, mirroring `listForCustomer`. */
  listForAgent(input?: ListViewingRequestsInput): Promise<ViewingRequestListResult>;
  /** BOOK-003. Only while `status IN ('pending', 'confirmed')` (api-design.md §8.5). */
  reschedule(id: string, input: RescheduleViewingRequestInput): Promise<ViewingRequest>;
  /** BOOK-002. Only while `status = 'pending'` (api-design.md §8.7). */
  confirm(id: string): Promise<ViewingRequest>;
  /** BOOK-005. Only while `status = 'confirmed'` (api-design.md §8.8). */
  complete(id: string): Promise<ViewingRequest>;
  /** BOOK-006. Only while `status = 'confirmed'` (api-design.md §8.9). */
  markNoShow(id: string): Promise<ViewingRequest>;
}

// `customer:profiles(...)` embed added Sprint 6 for BOOK-001's booking queue
// (Gap 6) — a customer's own listForCustomer()/cancel() call just embeds
// their own profile back to them via the pre-existing `profiles_select_own`
// policy (harmless), so one shared column set covers both actors rather
// than two near-duplicate query shapes.
const VIEWING_REQUEST_COLUMNS = `
  id, customer_id, property_id, agent_id, requested_date, requested_time,
  status, notes, cancellation_reason, created_at, updated_at,
  property:properties(id, slug, title, images:property_images(id, image_url, alt_text, display_order)),
  customer:profiles(id, full_name, phone)
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

  // Shared between the customer's own cancellation (VIEW-004) and an
  // agent's (BOOK-004, Sprint 6) — RLS's `viewing_requests_cancel_own_customer`
  // policy already constrains the *customer* path to pending/confirmed rows,
  // but `viewing_requests_update_own_agent` has no such transition
  // constraint at all (confirmed directly against the migration — RLS is
  // ownership-only for the agent path, matching the Sprint 6 plan's Part B
  // decision to keep status-machine legality a Repository/Service concern,
  // not RLS). The explicit `.in('status', ...)` guard below is therefore
  // load-bearing for the agent path and merely redundant-but-harmless for
  // the customer path. 0 rows matched (not theirs, wrong status, or already
  // terminal) surfaces as PGRST116, mapped to INVALID_STATE_TRANSITION
  // rather than a not-found: the UI only ever shows Cancel on a request the
  // caller can already see, so a real hit here is stale state, not an
  // ownership violation (api-design.md §15.3).
  async cancel(id, reason) {
    const { data, error } = await supabase
      .from('viewing_requests')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason ?? null,
      })
      .eq('id', id)
      .in('status', ['pending', 'confirmed'])
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

  // RLS's agent-facing SELECT policy already scopes this to rows where
  // `agent_id` is the caller's own; no explicit filter needed here,
  // mirroring `listForCustomer`'s identical reliance on RLS.
  async listForAgent(input = {}) {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
    const sort = input.sort ?? 'requestedDateAsc';
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

  // `viewing_requests_update_own_agent` has no transition constraint of its
  // own (see `cancel()`'s note above) — the `.in('status', ...)` guard here
  // is the actual enforcement of api-design.md §8.5's "only while pending or
  // confirmed" rule, not just a defensive extra.
  async reschedule(id, input) {
    const { data, error } = await supabase
      .from('viewing_requests')
      .update({ requested_date: input.requestedDate, requested_time: input.requestedTime })
      .eq('id', id)
      .in('status', ['pending', 'confirmed'])
      .select(VIEWING_REQUEST_COLUMNS)
      .single<ViewingRequestRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'INVALID_STATE_TRANSITION' });
    return mapViewingRequestRow(data);
  },

  // `.eq('status', 'pending')` is the actual enforcement of api-design.md
  // §8.7's "only while pending" rule (same reasoning as `reschedule()`).
  async confirm(id) {
    const { data, error } = await supabase
      .from('viewing_requests')
      .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'pending')
      .select(VIEWING_REQUEST_COLUMNS)
      .single<ViewingRequestRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'INVALID_STATE_TRANSITION' });
    return mapViewingRequestRow(data);
  },

  // `.eq('status', 'confirmed')` is the actual enforcement of api-design.md
  // §8.8's "only while confirmed" rule.
  async complete(id) {
    const { data, error } = await supabase
      .from('viewing_requests')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'confirmed')
      .select(VIEWING_REQUEST_COLUMNS)
      .single<ViewingRequestRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'INVALID_STATE_TRANSITION' });
    return mapViewingRequestRow(data);
  },

  // `.eq('status', 'confirmed')` is the actual enforcement of api-design.md
  // §8.9's "only while confirmed" rule. No `no_show_at` column exists
  // (database.md §5.13) — `updated_at`'s own trigger already captures when
  // this transition happened.
  async markNoShow(id) {
    const { data, error } = await supabase
      .from('viewing_requests')
      .update({ status: 'no_show' })
      .eq('id', id)
      .eq('status', 'confirmed')
      .select(VIEWING_REQUEST_COLUMNS)
      .single<ViewingRequestRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'INVALID_STATE_TRANSITION' });
    return mapViewingRequestRow(data);
  },
};
