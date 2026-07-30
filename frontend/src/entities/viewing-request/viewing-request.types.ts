import type { ISODateTime, UUID } from '@/entities/user';
import type { Property } from '@/entities/property';

export type ViewingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

/** The slim property subset every list endpoint expands (api-design.md §3.1's `Pick<Property, 'id'|'slug'|'title'|'images'>`). */
export type ViewingRequestProperty = Pick<Property, 'id' | 'slug' | 'title' | 'images'>;

/**
 * Sprint 6, BOOK-001: the agent's booking queue needs to show who booked.
 * Resolved via the new `profiles_select_own_customers_by_agent` RLS policy
 * (database.md §9, Gap 6) — for a customer's own `listForCustomer()`/`cancel()`
 * call this just embeds their own profile back to them (harmless, already
 * allowed by `profiles_select_own` regardless of role), kept as one shared
 * column set rather than two near-duplicate query shapes.
 */
export interface ViewingRequestCustomer {
  id: UUID;
  fullName: string;
  phone: string | null;
}

/** api-design.md §3.1. */
export interface ViewingRequest {
  id: UUID;
  customerId: UUID;
  propertyId: UUID;
  agentId: UUID;
  requestedDate: string; // YYYY-MM-DD
  requestedTime: string; // HH:mm
  status: ViewingStatus;
  notes: string | null;
  cancellationReason: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  property: ViewingRequestProperty;
  customer: ViewingRequestCustomer | null;
}

/** api-design.md §16.2 — offset pagination shape shared with Favorites. */
export interface ViewingRequestListMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ViewingRequestListResult {
  data: ViewingRequest[];
  meta: ViewingRequestListMeta;
}

/**
 * CUST-001 (soonest-first), CUST-002 (most-recently-occurred-first), and
 * VIEW-005 (most-recently-requested-first) each need a different ordering
 * from the same `listForCustomer` call — a `sort` param avoids three
 * near-duplicate repository methods (api-design.md §8.3).
 */
export type ViewingRequestSort = 'requestedDateAsc' | 'requestedDateDesc' | 'createdAtDesc';

export interface ListViewingRequestsInput {
  status?: ViewingStatus[];
  page?: number;
  pageSize?: number;
  sort?: ViewingRequestSort;
}

export interface CreateViewingRequestInput {
  propertyId: UUID;
  agentId: UUID;
  requestedDate: string;
  requestedTime: string;
  notes?: string;
}

/** BOOK-003. */
export interface RescheduleViewingRequestInput {
  requestedDate: string;
  requestedTime: string;
}
