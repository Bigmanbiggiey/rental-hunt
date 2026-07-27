import type { Cursor, PropertySortOrder } from './property.types';

/**
 * api-design.md §16.1 documents the cursor as an opaque `{ createdAt, id }`
 * pair, but true keyset pagination requires the cursor tuple to match
 * whichever `ORDER BY` is actually active — which breaks once a guest picks
 * `price_asc`/`price_desc` (DISC-004). Widened here to `{ sortValue, id, sort }`
 * while keeping the external contract unchanged (opaque, pass back verbatim).
 * See `api-design.md` §16.1's Sprint 3 addendum.
 */
export interface DecodedCursor {
  sortValue: string;
  id: string;
  sort: PropertySortOrder;
}

export function encodeCursor(cursor: DecodedCursor): Cursor {
  return btoa(JSON.stringify(cursor));
}

export function decodeCursor(cursor: Cursor): DecodedCursor {
  return JSON.parse(atob(cursor)) as DecodedCursor;
}

/** The column the active sort orders by — also the cursor's `sortValue` source. */
export function sortColumn(sort: PropertySortOrder): 'rent_amount' | 'created_at' {
  return sort === 'price_asc' || sort === 'price_desc' ? 'rent_amount' : 'created_at';
}

export function sortAscending(sort: PropertySortOrder): boolean {
  return sort === 'price_asc';
}
