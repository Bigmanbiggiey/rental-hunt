import { parseOrThrow } from '@/shared/lib/errors';
import { agencyRepository } from '@/entities/agency';
import { CreateAgencySchema, type CreateAgencyFormInput } from '../schemas/createAgency.schema';
import { UpdateAgencySchema, type UpdateAgencyFormInput } from '../schemas/updateAgency.schema';

export const adminAgencyService = {
  async list() {
    return agencyRepository.list();
  },

  async create(input: CreateAgencyFormInput) {
    const parsed = parseOrThrow(CreateAgencySchema, input);
    return agencyRepository.create(parsed);
  },

  async update(id: string, input: UpdateAgencyFormInput) {
    const parsed = parseOrThrow(UpdateAgencySchema, input);
    return agencyRepository.update(id, parsed);
  },

  /** Epic 12 — no Zod needed, `approve_agency_application()` takes only an id. */
  async approveApplication(id: string) {
    return agencyRepository.approve(id);
  },

  /** Epic 12 — the RPC itself enforces "reason required," Service just passes it through. */
  async rejectApplication(id: string, reason: string) {
    return agencyRepository.reject(id, reason);
  },
};
