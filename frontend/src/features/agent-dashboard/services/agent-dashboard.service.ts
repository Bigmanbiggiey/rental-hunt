import { agentRepository } from '@/entities/agent';
import { agentDashboardRepository } from '../repositories/agent-dashboard.repository';

export const agentDashboardService = {
  async getSummary(profileId: string) {
    const agent = await agentRepository.getCurrentAgent(profileId);
    return agentDashboardRepository.getSummary(agent.agencyId);
  },
};
