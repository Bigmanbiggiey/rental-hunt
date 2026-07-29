import { supabase } from '@/shared/lib/supabase';
import { AppError, mapSupabaseError } from '@/shared/lib/errors';
import {
  PROPERTY_COLUMNS,
  mapPropertyRow,
  type Property,
  type PropertyRow,
} from '@/entities/property';

// api-design.md §7's underlying-call shapes. Lives in `features/favorites`,
// not `entities/`, since — unlike `viewing_requests` — no other scheduled
// sprint needs favorites data outside this feature (the opposite placement
// from `entities/viewing-request`, for the opposite reason; see ADR-027).
export interface Favorite {
  propertyId: string;
  createdAt: string;
  property: Property;
}

export interface FavoritesRepository {
  save(propertyId: string): Promise<void>;
  remove(propertyId: string): Promise<void>;
  list(
    page?: number,
    pageSize?: number,
  ): Promise<{
    data: Favorite[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }>;
  listIds(): Promise<string[]>;
}

interface FavoriteRow {
  property_id: string;
  created_at: string;
  property: PropertyRow;
}

const DEFAULT_PAGE_SIZE = 20;

async function currentCustomerId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw mapSupabaseError(error);
  if (!data.user) throw new AppError('UNAUTHENTICATED', 'Please sign in to continue.');
  return data.user.id;
}

export const favoritesRepository: FavoritesRepository = {
  // Idempotent per api-design.md §7.1 — saving an already-favorited property
  // is a no-op success, not a CONFLICT error (the user's intent is already
  // satisfied).
  async save(propertyId) {
    const customerId = await currentCustomerId();
    const { error } = await supabase
      .from('favorites')
      .upsert(
        { customer_id: customerId, property_id: propertyId },
        { onConflict: 'customer_id,property_id', ignoreDuplicates: true },
      );
    // No `.single()` here, so PGRST116 never applies — a nonexistent
    // propertyId instead fails as a foreign_key_violation (23503), already
    // mapped to VALIDATION_ERROR below, a reasonable stand-in for
    // api-design.md §7.1's documented PROPERTY_NOT_FOUND.
    if (error) throw mapSupabaseError(error);
  },

  // Idempotent per api-design.md §7.2 — removing a non-favorited property is
  // also a no-op success.
  async remove(propertyId) {
    const customerId = await currentCustomerId();
    const { error } = await supabase
      .from('favorites')
      .delete()
      .match({ customer_id: customerId, property_id: propertyId });
    if (error) throw mapSupabaseError(error);
  },

  async list(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('favorites')
      .select(`property_id, created_at, property:properties(${PROPERTY_COLUMNS})`, {
        count: 'exact',
      })
      .order('created_at', { ascending: false })
      .range(from, to)
      .returns<FavoriteRow[]>();

    if (error) throw mapSupabaseError(error);

    const total = count ?? 0;
    return {
      data: (data ?? []).map((row) => ({
        propertyId: row.property_id,
        createdAt: row.created_at,
        property: mapPropertyRow(row.property),
      })),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  // A slim `property_id`-only query (api-design.md §7's own addition, not
  // §7.3's `list()`) — too heavy to call `list()`'s full expanded shape from
  // every PropertyCard render just to answer "is this one saved?".
  async listIds() {
    const { data, error } = await supabase
      .from('favorites')
      .select('property_id')
      .returns<{ property_id: string }[]>();

    if (error) throw mapSupabaseError(error);
    return (data ?? []).map((row) => row.property_id);
  },
};
