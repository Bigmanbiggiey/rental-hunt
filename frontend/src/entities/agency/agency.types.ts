import type { UUID } from '@/entities/user';

/** api-design.md §13's `agencies.social_links` (Epic 12) — keys are all optional, validated at the Zod layer. */
export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
}

/** database.md §5.3's `agency_onboarding_status` enum (Epic 12). */
export type AgencyOnboardingStatus = 'pending_review' | 'approved' | 'rejected';

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
  socialLinks: SocialLinks;
  onboardingStatus: AgencyOnboardingStatus;
  appliedBy: UUID | null;
  rejectionReason: string | null;
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
  socialLinks?: SocialLinks;
}

export type UpdateAgencyInput = Partial<CreateAgencyInput> & { isActive?: boolean };

/**
 * Same shape as `CreateAgencyInput` — a customer applying for their own
 * agency (Epic 12). `applied_by` is never part of this input: the
 * `enforce_agency_onboarding_status()` trigger always forces it to the
 * caller's own `auth.uid()` server-side, regardless of what's sent.
 */
export type ApplyForAgencyInput = CreateAgencyInput;
