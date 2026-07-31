import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors/mapSupabaseError';
import {
  PROPERTY_COLUMNS,
  propertyRepository,
  mapPropertyRow,
  type AgentPropertyListResult,
  type Property,
  type PropertyRow,
} from '@/entities/property';
import { mapPropertyVerificationRow, type PropertyVerificationRow } from './property-verification.mapper';
import type { PropertyVerification, VerificationActionInput } from './property-verification.types';

const DEFAULT_PAGE_SIZE = 20;

// api-design.md §13. Cross-cutting: an agent's own `VerificationStatusPanel`
// reads `history()` for their own agency's properties (RLS-scoped), while
// the moderator/admin verification queue reads `listPending()`/`setStatus()`
// — two real, independent consumer sides, which is exactly the ADR-026/028
// "2+ consumers" test for living in `entities/` rather than a single
// feature's own `repositories/` folder.
export interface VerificationRepository {
  listPending(page?: number, pageSize?: number): Promise<AgentPropertyListResult>;
  setStatus(
    propertyId: string,
    input: VerificationActionInput,
  ): Promise<{ property: Property; verification: PropertyVerification }>;
  history(propertyId: string): Promise<PropertyVerification[]>;
}

export const verificationRepository: VerificationRepository = {
  // Oldest-first — a fair review queue, not most-recently-submitted-first.
  async listPending(page = 1, pageSize = DEFAULT_PAGE_SIZE) {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('properties')
      .select(PROPERTY_COLUMNS, { count: 'exact' })
      .eq('verification_status', 'pending_verification')
      .order('created_at', { ascending: true })
      .range(from, to)
      .returns<PropertyRow[]>();

    if (error) throw mapSupabaseError(error);

    const total = count ?? 0;
    return {
      data: (data ?? []).map(mapPropertyRow),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  // The RPC returns the raw `property_verifications` row (not a joined
  // shape) — the full `Property` DTO is re-fetched afterward, the same
  // two-step "RPC returns raw row, then re-fetch" shape already established
  // by `propertyRepository.create()`/`submitForVerification()`.
  async setStatus(propertyId, input) {
    const { data, error } = await supabase
      .rpc('set_property_verification', {
        property_id: propertyId,
        new_status: input.status,
        reason: input.reason ?? null,
      })
      .single<PropertyVerificationRow>();

    if (error) throw mapSupabaseError(error, { notFoundCode: 'PROPERTY_NOT_FOUND' });

    const property = await propertyRepository.getByIdAdmin(propertyId);
    return { property, verification: mapPropertyVerificationRow(data) };
  },

  async history(propertyId) {
    const { data, error } = await supabase
      .from('property_verifications')
      .select('id, property_id, previous_status, new_status, reviewed_by, reason, created_at')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .returns<PropertyVerificationRow[]>();

    if (error) throw mapSupabaseError(error);
    return (data ?? []).map(mapPropertyVerificationRow);
  },
};
