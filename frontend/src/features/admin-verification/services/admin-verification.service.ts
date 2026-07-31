import { parseOrThrow } from '@/shared/lib/errors';
import { verificationRepository } from '@/entities/property-verification';
import {
  VerificationActionSchema,
  type VerificationActionFormInput,
} from '../schemas/verificationAction.schema';

export const adminVerificationService = {
  async listPending(page?: number, pageSize?: number) {
    return verificationRepository.listPending(page, pageSize);
  },

  async setStatus(propertyId: string, input: VerificationActionFormInput) {
    const parsed = parseOrThrow(VerificationActionSchema, input);
    return verificationRepository.setStatus(propertyId, parsed);
  },

  async history(propertyId: string) {
    return verificationRepository.history(propertyId);
  },
};
