import { AppError, parseOrThrow } from '@/shared/lib/errors';
import type { Property } from '@/entities/property';
import {
  viewingRequestRepository,
  type ListViewingRequestsInput,
} from '@/entities/viewing-request';
import {
  CreateViewingRequestSchema,
  type CreateViewingRequestInput,
} from '../schemas/createViewingRequest.schema';
import { CancelViewingRequestSchema } from '../schemas/cancelViewingRequest.schema';

export const viewingRequestService = {
  /**
   * The Service-layer half of database.md §9's "check first for good UX" —
   * uses the already-loaded `Property` from the page rather than a redundant
   * re-fetch. The `prevent_booking_unavailable_property()` DB trigger
   * remains the real backstop for a race where availability changes between
   * page load and submit; that path surfaces the same PROPERTY_NOT_AVAILABLE
   * code via mapSupabaseError's RH001 mapping.
   */
  async create(property: Property, input: CreateViewingRequestInput) {
    if (property.availabilityStatus !== 'available') {
      throw new AppError(
        'PROPERTY_NOT_AVAILABLE',
        'This property is no longer available for booking.',
      );
    }

    const parsed = parseOrThrow(CreateViewingRequestSchema, input);
    return viewingRequestRepository.create({
      propertyId: property.id,
      agentId: property.agentId,
      ...parsed,
    });
  },

  async cancel(id: string, reason?: string) {
    const parsed = parseOrThrow(CancelViewingRequestSchema, { reason });
    return viewingRequestRepository.cancel(id, parsed.reason);
  },

  async listForCustomer(input?: ListViewingRequestsInput) {
    return viewingRequestRepository.listForCustomer(input);
  },
};
