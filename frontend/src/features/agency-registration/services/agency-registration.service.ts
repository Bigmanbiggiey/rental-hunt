import { parseOrThrow } from '@/shared/lib/errors';
import { agencyRepository } from '@/entities/agency';
import { ApplyForAgencySchema, type ApplyForAgencyFormInput } from '../schemas/applyForAgency.schema';

export const agencyRegistrationService = {
  async apply(input: ApplyForAgencyFormInput) {
    const parsed = parseOrThrow(ApplyForAgencySchema, input);
    return agencyRepository.applySelf(parsed);
  },

  async getMyApplication() {
    return agencyRepository.getMyApplication();
  },
};
