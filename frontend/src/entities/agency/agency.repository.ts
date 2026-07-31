import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors/mapSupabaseError';
import { slugify } from '@/shared/lib/slugify';
import { mapAgencyRow, type AgencyRow } from './agency.mapper';
import type { Agency, CreateAgencyInput, UpdateAgencyInput } from './agency.types';

// api-design.md §13. `getById` is a documented extension, not in the
// original contract — the admin edit form needs to fetch a single agency to
// prefill, and `list()`'s `Agency[]` shape has no id-scoped variant;
// CLAUDE.md §6's "extend the contract first" rule applies (recorded in
// api-design.md §13 alongside this method in the same change).
export interface AgencyRepository {
  list(filters?: { county?: string }): Promise<Agency[]>;
  getById(id: string): Promise<Agency>;
  getBySlug(slug: string): Promise<Agency>;
  /** Admin only (RLS `agencies_insert_admin`) — `slug` is Service-resolved via `slugify(name)`, never user-editable. */
  create(input: CreateAgencyInput): Promise<Agency>;
  /** Admin (any field), or the agency's own agent (RLS `agencies_update_own_agent` — non-critical fields only). */
  update(id: string, input: UpdateAgencyInput): Promise<Agency>;
}

const AGENCY_COLUMNS = 'id, name, slug, description, logo_url, phone, email, county_id, is_active';

export const agencyRepository: AgencyRepository = {
  async list(filters = {}) {
    let query = supabase.from('agencies').select(AGENCY_COLUMNS).order('name', { ascending: true });
    if (filters.county) query = query.eq('county_id', filters.county);

    const { data, error } = await query.returns<AgencyRow[]>();
    if (error) throw mapSupabaseError(error);
    return (data ?? []).map(mapAgencyRow);
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('agencies')
      .select(AGENCY_COLUMNS)
      .eq('id', id)
      .single<AgencyRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'AGENCY_NOT_FOUND' });
    return mapAgencyRow(data);
  },

  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('agencies')
      .select(AGENCY_COLUMNS)
      .eq('slug', slug)
      .single<AgencyRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'AGENCY_NOT_FOUND' });
    return mapAgencyRow(data);
  },

  async create(input) {
    const { data, error } = await supabase
      .from('agencies')
      .insert({
        name: input.name,
        slug: slugify(input.name),
        description: input.description,
        logo_url: input.logoUrl,
        phone: input.phone,
        email: input.email,
        county_id: input.countyId,
      })
      .select(AGENCY_COLUMNS)
      .single<AgencyRow>();

    if (error) throw mapSupabaseError(error);
    return mapAgencyRow(data);
  },

  async update(id, input) {
    const patch: Record<string, unknown> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.logoUrl !== undefined) patch.logo_url = input.logoUrl;
    if (input.phone !== undefined) patch.phone = input.phone;
    if (input.email !== undefined) patch.email = input.email;
    if (input.countyId !== undefined) patch.county_id = input.countyId;
    if (input.isActive !== undefined) patch.is_active = input.isActive;

    const { data, error } = await supabase
      .from('agencies')
      .update(patch)
      .eq('id', id)
      .select(AGENCY_COLUMNS)
      .single<AgencyRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'AGENCY_NOT_FOUND' });
    return mapAgencyRow(data);
  },
};
