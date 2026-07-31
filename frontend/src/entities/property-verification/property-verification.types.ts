import type { ISODateTime, UUID } from '@/entities/user';
import type { PropertyVerificationStatus } from '@/entities/property';

/** api-design.md §3.1. */
export interface PropertyVerification {
  id: UUID;
  propertyId: UUID;
  previousStatus: PropertyVerificationStatus | null;
  newStatus: PropertyVerificationStatus;
  reviewedBy: UUID;
  reason: string | null;
  createdAt: ISODateTime;
}

/** api-design.md §13's `VerificationRepository.setStatus` input; §6.9's request shape. */
export interface VerificationActionInput {
  status: Exclude<PropertyVerificationStatus, 'unverified'>;
  reason?: string;
}
