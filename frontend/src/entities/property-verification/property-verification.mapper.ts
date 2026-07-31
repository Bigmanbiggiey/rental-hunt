import type { PropertyVerificationStatus } from '@/entities/property';
import type { PropertyVerification } from './property-verification.types';

/** Shape of a raw `public.property_verifications` row (database.md §5.15), snake_case as PostgREST returns it. */
export interface PropertyVerificationRow {
  id: string;
  property_id: string;
  previous_status: PropertyVerificationStatus | null;
  new_status: PropertyVerificationStatus;
  reviewed_by: string;
  reason: string | null;
  created_at: string;
}

export function mapPropertyVerificationRow(row: PropertyVerificationRow): PropertyVerification {
  return {
    id: row.id,
    propertyId: row.property_id,
    previousStatus: row.previous_status,
    newStatus: row.new_status,
    reviewedBy: row.reviewed_by,
    reason: row.reason,
    createdAt: row.created_at,
  };
}
