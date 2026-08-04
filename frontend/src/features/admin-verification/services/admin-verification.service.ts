import { parseOrThrow } from '@/shared/lib/errors';
import { propertyRepository } from '@/entities/property';
import { verificationRepository } from '@/entities/property-verification';
import {
  VerificationActionSchema,
  type VerificationActionFormInput,
} from '../schemas/verificationAction.schema';

export const adminVerificationService = {
  async listPending(page?: number, pageSize?: number) {
    return verificationRepository.listPending(page, pageSize);
  },

  // Backs the review page's "view full listing details before deciding" flow
  // — reuses `propertyRepository.getByIdAdmin()` directly rather than routing
  // through `verificationRepository` (this is plain property data, not
  // verification-workflow data; `verificationRepository.setStatus()` already
  // establishes the same cross-entity call precedent).
  async getById(propertyId: string) {
    return propertyRepository.getByIdAdmin(propertyId);
  },

  async setStatus(propertyId: string, input: VerificationActionFormInput) {
    const parsed = parseOrThrow(VerificationActionSchema, input);
    return verificationRepository.setStatus(propertyId, parsed);
  },

  async history(propertyId: string) {
    return verificationRepository.history(propertyId);
  },
};
