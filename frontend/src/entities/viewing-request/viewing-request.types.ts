import type { ISODateTime, UUID } from '@/entities/user';
import type { Property } from '@/entities/property';

export type ViewingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

/** The slim property subset every list endpoint expands (api-design.md §3.1's `Pick<Property, 'id'|'slug'|'title'|'images'>`). */
export type ViewingRequestProperty = Pick<Property, 'id' | 'slug' | 'title' | 'images'>;

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
