import type { UUID } from '@/entities/user';

/** api-design.md §3.1. */
export interface Agency {
  id: UUID;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  phone: string | null;
  email: string | null;
  countyId: UUID | null;
  isActive: boolean;
}

/**
 * api-design.md §13's `AgencyRepository.create`/`update` share this shape
 * (`Partial<CreateAgencyInput>` for update). `slug` is deliberately absent —
 * Service-resolved via `slugify(name)`, matching `agentPropertyService.create()`'s
 * "slug is Service-resolved, not user-editable" precedent (database.md §5.3's
 * unique constraint means a hand-edited slug risks a collision the form
 * can't usefully recover from).
 */
export interface CreateAgencyInput {
  name: string;
  description?: string;
  logoUrl?: string;
  phone?: string;
  email?: string;
  countyId?: UUID;
}

export type UpdateAgencyInput = Partial<CreateAgencyInput> & { isActive?: boolean };
