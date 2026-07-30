import { parseOrThrow } from '@/shared/lib/errors';
import { slugify } from '@/shared/lib/slugify';
import { agentRepository } from '@/entities/agent';
import {
  propertyRepository,
  type AgentPropertyFilters,
  type PropertyAvailabilityStatus,
} from '@/entities/property';
import { CreatePropertySchema, type CreatePropertyFormInput } from '../schemas/createProperty.schema';
import { UpdatePropertySchema, type UpdatePropertyFormInput } from '../schemas/updateProperty.schema';

export const agentPropertyService = {
  // Resolves the caller's own agent/agency via `getCurrentAgent()` — the
  // form never lets an agent pick `agentId`/`agencyId` themselves (AGENT-002
  // has no "assign to a colleague" criterion). `slug` is Service-resolved,
  // not user-editable, matching `viewingRequestService.create()`'s
  // `{ ...resolved, ...parsed }` precedent.
  async create(profileId: string, input: CreatePropertyFormInput) {
    const parsed = parseOrThrow(CreatePropertySchema, input);
    const agent = await agentRepository.getCurrentAgent(profileId);
    return propertyRepository.create(agent.agencyId, {
      ...parsed,
      agentId: agent.id,
      slug: slugify(parsed.title),
    });
  },

  // `agencyId` resolved here, not left to RLS alone — same reasoning as
  // `listForAgent` below. Previously called directly from the Hook,
  // bypassing this Service entirely (a real, small architecture-chain gap
  // found and fixed in the same pass as the agency-scoping fix).
  async getById(profileId: string, id: string) {
    const agent = await agentRepository.getCurrentAgent(profileId);
    return propertyRepository.getById(id, agent.agencyId);
  },

  async update(id: string, input: UpdatePropertyFormInput) {
    const parsed = parseOrThrow(UpdatePropertySchema, input);
    return propertyRepository.update(id, parsed);
  },

  async archive(id: string, archived = true) {
    return propertyRepository.archive(id, archived);
  },

  async updateAvailability(id: string, status: PropertyAvailabilityStatus) {
    return propertyRepository.updateAvailability(id, status);
  },

  async submitForVerification(id: string) {
    return propertyRepository.submitForVerification(id);
  },

  // `agencyId` resolved here, not left to RLS alone — see the Repository's
  // own note on why that would leak other agencies' guest-visible rows in.
  async listForAgent(profileId: string, filters?: AgentPropertyFilters, page?: number, pageSize?: number) {
    const agent = await agentRepository.getCurrentAgent(profileId);
    return propertyRepository.listForAgent(agent.agencyId, filters, page, pageSize);
  },
};
