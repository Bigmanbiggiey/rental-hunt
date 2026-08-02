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

const VIEWING_REQUEST_RATE_LIMIT = 10;
const VIEWING_REQUEST_RATE_WINDOW_SECONDS = 60 * 60;

export const viewingRequestService = {
  /**
   * The Service-layer half of database.md §9's "check first for good UX" —
   * uses the already-loaded `Property` from the page rather than a redundant
   * re-fetch. The `prevent_booking_unavailable_property()` DB trigger
   * remains the real backstop for a race where availability changes between
   * page load and submit; that path surfaces the same PROPERTY_NOT_AVAILABLE
   * code via mapSupabaseError's RH001 mapping.
   *
   * api-design.md §18's Service-layer rate limit ("10 per hour, per
   * customer") — checked before the availability/validation checks below
   * since it's the cheapest reason to reject, and a spam-booking attempt
   * shouldn't get free property-existence/availability information.
   */
  async create(property: Property, input: CreateViewingRequestInput) {
    const windowStart = new Date(Date.now() - VIEWING_REQUEST_RATE_WINDOW_SECONDS * 1000).toISOString();
    const recentCount = await viewingRequestRepository.countRecentByCustomer(windowStart);
    if (recentCount >= VIEWING_REQUEST_RATE_LIMIT) {
      throw new AppError('RATE_LIMITED', 'Too many viewing requests. Please try again later.', {
        retryAfterSeconds: String(VIEWING_REQUEST_RATE_WINDOW_SECONDS),
      });
    }

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
