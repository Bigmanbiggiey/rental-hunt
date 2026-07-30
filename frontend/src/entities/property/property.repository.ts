import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors';
import { mapPropertyRow, type PropertyRow } from './property.mapper';
import { decodeCursor, encodeCursor, sortAscending, sortColumn } from './cursor';
import type {
  AgentPropertyFilters,
  AgentPropertyListResult,
  CreatePropertyInput,
  Cursor,
  Property,
  PropertyAvailabilityStatus,
  PropertyFilters,
  PropertyListResult,
} from './property.types';

export interface PropertyRepository {
  list(filters: PropertyFilters, cursor?: Cursor, limit?: number): Promise<PropertyListResult>;
  listFeatured(limit?: number): Promise<Property[]>;
  getBySlug(slug: string): Promise<Property>;
  /** AGENT-003's edit form — fetches by id, not slug, since the id is what routing/every other agent-side method already carries. `agencyId` is an explicit, load-bearing filter (same reasoning as `listForAgent`'s own note) — without it, RLS's guest-visibility policy would still let another agency's guest-visible property be fetched (read-only; the dedicated agent-`UPDATE`-own-agency policy already blocks any actual write regardless), which would incorrectly show up in this agent's own edit form. */
  getById(id: string, agencyId: string): Promise<Property>;
  listRelated(input: {
    propertyId: string;
    countyId: string;
    propertyTypeId: string;
    limit?: number;
  }): Promise<Property[]>;
  /** AGENT-002. `agencyId` is trusted input from the Service layer (resolved via `getCurrentAgent()`) — RLS's `properties_insert_agent_own_agency` policy is the actual authority, this is just the mechanical write. */
  create(agencyId: string, input: CreatePropertyInput): Promise<Property>;
  /** AGENT-003. `agentId`/`slug` are deliberately not patchable — reassignment is out of Sprint 6's scope (Gap 6) and a slug rename would break existing links/bookmarks. */
  update(id: string, input: Partial<CreatePropertyInput>): Promise<Property>;
  /** AGENT-004. Bidirectional — `archived: false` un-archives, closing the obvious "archived by mistake" gap the one-directional doc example left open. */
  archive(id: string, archived?: boolean): Promise<Property>;
  updateAvailability(id: string, status: PropertyAvailabilityStatus): Promise<Property>;
  /** AGENT-001/002/006's agency-wide list/search/filter — offset-paginated (database.md §14). `agencyId` is an explicit, load-bearing filter — RLS alone also permits *other* agencies' guest-visible rows through (see the implementation's own note), which is correct for public browsing but wrong for this agency-scoped view. */
  listForAgent(
    agencyId: string,
    filters?: AgentPropertyFilters,
    page?: number,
    pageSize?: number,
  ): Promise<AgentPropertyListResult>;
  /** AGENT-008. Fire-and-forget from `useTrackPropertyView`; deliberately not folded into `getBySlug` (would double-count on TanStack Query refetch/refocus). */
  incrementViewCount(id: string): Promise<void>;
  /** AGENT-007's agent-facing half — wraps the `submit_property_for_verification` RPC (database.md §9, Gap 2); the RPC itself enforces own-agency + unverified/rejected-only. */
  submitForVerification(id: string): Promise<Property>;
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
const DEFAULT_PAGE_SIZE = 20;

async function fetchById(id: string): Promise<Property> {
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_COLUMNS)
    .eq('id', id)
    .single<PropertyRow>();
  if (error) throw mapSupabaseError(error, { notFoundCode: 'PROPERTY_NOT_FOUND' });
  return mapPropertyRow(data);
}

/** Full replace, not a diff — mirrors `reorder()`'s planned metadata-only-write shape for the same join table. */
async function replacePropertyAmenities(propertyId: string, amenityIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('property_amenities')
    .delete()
    .eq('property_id', propertyId);
  if (deleteError) throw mapSupabaseError(deleteError);

  if (amenityIds.length === 0) return;

  const { error: insertError } = await supabase
    .from('property_amenities')
    .insert(amenityIds.map((amenityId) => ({ property_id: propertyId, amenity_id: amenityId })));
  if (insertError) throw mapSupabaseError(insertError);
}

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
  // increment here — `incrementViewCount()` below is its own fire-and-forget
  // call from `useTrackPropertyView`, not folded into this query, so a
  // TanStack Query refetch/refocus on this same slug doesn't double-count.
  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('properties')
      .select(PROPERTY_COLUMNS)
      .eq('slug', slug)
      .single<PropertyRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'PROPERTY_NOT_FOUND' });
    return mapPropertyRow(data);
  },

  // Deliberately its own query, not the shared `fetchById()` helper below —
  // `fetchById()` is reused by `create`/`update`/`archive`/`updateAvailability`/
  // `submitForVerification`, all of which are already correctly scoped by
  // RLS's agent-`UPDATE`-own-agency policy on the write side; this is the
  // one read-only call site that needed its own explicit `agency_id` guard.
  async getById(id, agencyId) {
    const { data, error } = await supabase
      .from('properties')
      .select(PROPERTY_COLUMNS)
      .eq('id', id)
      .eq('agency_id', agencyId)
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

  async create(agencyId, input) {
    const { data: inserted, error: insertError } = await supabase
      .from('properties')
      .insert({
        agency_id: agencyId,
        agent_id: input.agentId,
        slug: input.slug,
        title: input.title,
        description: input.description,
        property_type_id: input.propertyTypeId,
        county_id: input.countyId,
        location_id: input.locationId,
        latitude: input.latitude,
        longitude: input.longitude,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        rent_amount: input.rentAmount,
        deposit_amount: input.depositAmount,
        availability_status: input.availabilityStatus,
      })
      .select('id')
      .single<{ id: string }>();

    if (insertError) throw mapSupabaseError(insertError);

    if (input.amenityIds.length > 0) {
      await replacePropertyAmenities(inserted.id, input.amenityIds);
    }

    return fetchById(inserted.id);
  },

  async update(id, input) {
    const patch: Record<string, unknown> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.propertyTypeId !== undefined) patch.property_type_id = input.propertyTypeId;
    if (input.countyId !== undefined) patch.county_id = input.countyId;
    if (input.locationId !== undefined) patch.location_id = input.locationId;
    if (input.latitude !== undefined) patch.latitude = input.latitude;
    if (input.longitude !== undefined) patch.longitude = input.longitude;
    if (input.bedrooms !== undefined) patch.bedrooms = input.bedrooms;
    if (input.bathrooms !== undefined) patch.bathrooms = input.bathrooms;
    if (input.rentAmount !== undefined) patch.rent_amount = input.rentAmount;
    if (input.depositAmount !== undefined) patch.deposit_amount = input.depositAmount;
    if (input.availabilityStatus !== undefined) patch.availability_status = input.availabilityStatus;

    if (input.amenityIds !== undefined) {
      await replacePropertyAmenities(id, input.amenityIds);
    }

    if (Object.keys(patch).length === 0) {
      return fetchById(id);
    }

    const { data, error } = await supabase
      .from('properties')
      .update(patch)
      .eq('id', id)
      .select(PROPERTY_COLUMNS)
      .single<PropertyRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'PROPERTY_NOT_FOUND' });
    return mapPropertyRow(data);
  },

  async archive(id, archived = true) {
    const { data, error } = await supabase
      .from('properties')
      .update({ is_archived: archived })
      .eq('id', id)
      .select(PROPERTY_COLUMNS)
      .single<PropertyRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'PROPERTY_NOT_FOUND' });
    return mapPropertyRow(data);
  },

  async updateAvailability(id, status) {
    const { data, error } = await supabase
      .from('properties')
      .update({ availability_status: status })
      .eq('id', id)
      .select(PROPERTY_COLUMNS)
      .single<PropertyRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'PROPERTY_NOT_FOUND' });
    return mapPropertyRow(data);
  },

  // A real cross-agency leak was found here via manual browser testing
  // (not caught by the RLS test suite, which deliberately used non-guest-
  // visible fixtures to isolate the agent-specific policy): RLS's guest-
  // visibility policy has no role restriction, so it also grants an agent
  // read access to *other* agencies' guest-visible (non-archived,
  // non-rejected) properties — correct and intended for public browsing,
  // but wrong for "my own agency's management list," which must be
  // narrower than what RLS alone permits. `agencyId` is therefore an
  // explicit, load-bearing filter here, not a defensive extra — mirroring
  // `create()`'s existing `(agencyId, input)` signature.
  async listForAgent(agencyId, filters = {}, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('properties')
      .select(PROPERTY_COLUMNS, { count: 'exact' })
      .eq('agency_id', agencyId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.archived !== undefined) query = query.eq('is_archived', filters.archived);
    if (filters.availabilityStatus) query = query.eq('availability_status', filters.availabilityStatus);
    if (filters.verificationStatus) query = query.eq('verification_status', filters.verificationStatus);
    if (filters.q) query = query.or(`title.ilike.%${filters.q}%,description.ilike.%${filters.q}%`);

    const { data, error, count } = await query.returns<PropertyRow[]>();
    if (error) throw mapSupabaseError(error);

    const total = count ?? 0;
    return {
      data: (data ?? []).map(mapPropertyRow),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  // Errors deliberately swallowed by the caller (`useTrackPropertyView`), not
  // here — this repository method still surfaces a real AppError so a unit
  // test can assert on it; api-design.md §6.2's "fire-and-forget" note is
  // about the Hook's handling, not this layer's.
  async incrementViewCount(id) {
    const { error } = await supabase.rpc('increment_property_view_count', { p_property_id: id });
    if (error) throw mapSupabaseError(error);
  },

  // The RPC returns the raw `properties` row (not the joined PROPERTY_COLUMNS
  // shape) — re-fetched via `fetchById` so the caller gets the full DTO,
  // same two-step shape as `create()`.
  async submitForVerification(id) {
    const { error } = await supabase.rpc('submit_property_for_verification', { p_property_id: id });
    if (error) throw mapSupabaseError(error, { notFoundCode: 'PROPERTY_NOT_FOUND' });
    return fetchById(id);
  },
};
