import { agencyRepository, type Agency } from '@/entities/agency';
import { agentRepository } from '@/entities/agent';
import { propertyRepository, type Cursor } from '@/entities/property';
import { reviewRepository } from '@/entities/review';

/**
 * Trivial passthrough Service — no Zod schema, same reasoning as
 * `property-details.service.ts`: a `:slug` route param isn't an ambiguous
 * filter object. Still a real Service (not hooks calling repositories
 * directly), per the Hook -> Service -> Repository chain.
 */
export const agencyProfileService = {
  async getBySlug(slug: string): Promise<Agency> {
    return agencyRepository.getBySlug(slug);
  },

  async listProperties(agencyId: string, cursor?: Cursor) {
    return propertyRepository.list({ agencyId }, cursor);
  },

  async listAgents(agencyId: string) {
    return agentRepository.listByAgency(agencyId);
  },

  async getRatingSummary(agencyId: string) {
    return reviewRepository.getAgencyRatingSummary(agencyId);
  },

  async getAgentRatingSummary(agentId: string) {
    return reviewRepository.getAgentRatingSummary(agentId);
  },

  async listReviews(agencyId: string, page?: number, pageSize?: number) {
    return reviewRepository.listForAgency(agencyId, page, pageSize);
  },
};
