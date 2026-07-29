import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors';
import { mapPropertyRow, type PropertyRow } from './property.mapper';
import { decodeCursor, encodeCursor, sortAscending, sortColumn } from './cursor';
import type { Cursor, Property, PropertyFilters, PropertyListResult } from './property.types';

export interface PropertyRepository {
  list(filters: PropertyFilters, cursor?: Cursor, limit?: number): Promise<PropertyListResult>;
  listFeatured(limit?: number): Promise<Property[]>;
  getBySlug(slug: string): Promise<Property>;
  listRelated(input: {
    propertyId: string;
    countyId: string;
    propertyTypeId: string;
    limit?: number;
  }): Promise<Property[]>;
}

// api-design.md §6.1's underlying-call shape — one query, no N+1 client-side
// fetches (database.md §14). `agent:agent_directory(...)` embeds cleanly even
// though the view has no declared FK (verified directly against PostgREST,
// not assumed): it resolves the relationship via `properties.agent_id`.
// Exported so `features/favorites` can reuse the exact same full-`Property`
// select shape for `Favorite.property` instead of duplicating a 20+-column
// list that would drift out of sync.
export const PROPERTY_COLUMNS = `
  id, slug, title, description, agency_id, agent_id, property_type_id, county_id, location_id,
  latitude, longitude, bedrooms, bathrooms, rent_amount, deposit_amount, currency,
  availability_status, verification_status, last_verified_at, is_featured, is_archived,
  view_count, created_at, updated_at,
  property_type:property_types(name),
  county:counties(name),
  location:locations(name),
  images:property_images(id, image_url, alt_text, display_order),
  amenities:property_amenities(amenity:amenities(id, name, icon)),
  agent:agent_directory(agent_id, agency_id, full_name, avatar_url, job_title, bio)
`;

const DEFAULT_LIMIT = 20;

/**
 * Resolves `q` (NFR-SEARCH-002, partial location/county matching) to a list
 * of matching `location_id`s, so the main query can combine it with a
 * title/description fallback via `.or()`. A separate round trip rather than
 * a single embedded-filter query — PostgREST can't filter a top-level query
 * by a nested embed's column in one `.or()` expression.
 */
async function resolveLocationIdsForQuery(q: string): Promise<string[]> {
  const { data: counties, error: countiesError } = await supabase
    .from('counties')
    .select('id')
    .ilike('name', `%${q}%`);
  if (countiesError) throw mapSupabaseError(countiesError);

  const countyIds = (counties ?? []).map((c: { id: string }) => c.id);

  let query = supabase.from('locations').select('id').ilike('name', `%${q}%`);
  if (countyIds.length > 0) {
    query = supabase
      .from('locations')
      .select('id')
      .or(`name.ilike.%${q}%,county_id.in.(${countyIds.join(',')})`);
  }
  const { data: locations, error: locationsError } = await query;
  if (locationsError) throw mapSupabaseError(locationsError);

  return (locations ?? []).map((l: { id: string }) => l.id);
}

/** api-design.md §17 — amenities use AND semantics via `property_ids_with_all_amenities`. */
async function resolveAmenityFilteredIds(amenityIds: string[]): Promise<string[] | null> {
  if (amenityIds.length === 0) return null;
  const { data, error } = await supabase.rpc('property_ids_with_all_amenities', {
    p_amenity_ids: amenityIds,
  });
  if (error) throw mapSupabaseError(error);
  return (data ?? []).map((row: { property_id: string } | string) =>
    typeof row === 'string' ? row : row.property_id,
  );
}

export const propertyRepository: PropertyRepository = {
  async list(filters, cursor, limit = DEFAULT_LIMIT) {
    const sort = filters.sort ?? 'newest';
    const column = sortColumn(sort);
    const ascending = sortAscending(sort);

    let query = supabase
      .from('properties')
      .select(PROPERTY_COLUMNS)
      .order(column, { ascending })
      .order('id', { ascending })
      .limit(limit);

    if (filters.county) query = query.eq('county_id', filters.county);
    if (filters.propertyType) query = query.eq('property_type_id', filters.propertyType);
    if (filters.bedroomsMin !== undefined) query = query.gte('bedrooms', filters.bedroomsMin);
    if (filters.bedroomsMax !== undefined) query = query.lte('bedrooms', filters.bedroomsMax);
    if (filters.minPrice !== undefined) query = query.gte('rent_amount', filters.minPrice);
    if (filters.maxPrice !== undefined) query = query.lte('rent_amount', filters.maxPrice);

    if (filters.amenities && filters.amenities.length > 0) {
      const ids = await resolveAmenityFilteredIds(filters.amenities);
      if (!ids || ids.length === 0) return { data: [], meta: { nextCursor: null, hasMore: false } };
      query = query.in('id', ids);
    }

    if (filters.q) {
      const locationIds = await resolveLocationIdsForQuery(filters.q);
      const textMatch = `title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`;
      query =
        locationIds.length > 0
          ? query.or(`location_id.in.(${locationIds.join(',')}),${textMatch}`)
          : query.or(textMatch);
    }

    if (cursor) {
      const decoded = decodeCursor(cursor);
      const op = ascending ? 'gt' : 'lt';
      query = query.or(
        `${column}.${op}.${decoded.sortValue},and(${column}.eq.${decoded.sortValue},id.${op}.${decoded.id})`,
      );
    }

    const { data, error } = await query.returns<PropertyRow[]>();
    if (error) throw mapSupabaseError(error);

    const rows = data ?? [];
    const hasMore = rows.length === limit && rows.length > 0;
    const lastRow = rows.at(-1);
    const nextCursor =
      hasMore && lastRow
        ? encodeCursor({
            sortValue: String(lastRow[column]),
            id: lastRow.id,
            sort,
          })
        : null;

    return {
      data: rows.map(mapPropertyRow),
      meta: { nextCursor, hasMore },
    };
  },

  async listFeatured(limit = 8) {
    const { data, error } = await supabase
      .from('properties')
      .select(PROPERTY_COLUMNS)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<PropertyRow[]>();

    if (error) throw mapSupabaseError(error);
    return (data ?? []).map(mapPropertyRow);
  },

  // api-design.md §6.2. Deliberately no getBySlug-adjacent view-count
  // increment here — no PROP-* acceptance criterion needs it, it only feeds
  // a future AGENT-008 dashboard story; see api-design.md §6.2's own note.
  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('properties')
      .select(PROPERTY_COLUMNS)
      .eq('slug', slug)
      .single<PropertyRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'PROPERTY_NOT_FOUND' });
    return mapPropertyRow(data);
  },

  // PROP-001's "related/similar properties" — same county OR same type (not
  // AND), so an uncommon type/location pairing still surfaces something;
  // deliberately not `.list()` with a bolted-on exclusion — that method's
  // cursor/AND-filter shape is the wrong tool for a small fixed set.
  async listRelated({ propertyId, countyId, propertyTypeId, limit = 4 }) {
    const { data, error } = await supabase
      .from('properties')
      .select(PROPERTY_COLUMNS)
      .or(`county_id.eq.${countyId},property_type_id.eq.${propertyTypeId}`)
      .neq('id', propertyId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .returns<PropertyRow[]>();

    if (error) throw mapSupabaseError(error);
    return (data ?? []).map(mapPropertyRow);
  },
};
