import { agentRepository } from '@/entities/agent';
import { agentAnalyticsRepository } from '../repositories/agent-analytics.repository';

export const agentAnalyticsService = {
  async listPropertyAnalytics(profileId: string) {
    const agent = await agentRepository.getCurrentAgent(profileId);
    return agentAnalyticsRepository.listPropertyAnalytics(agent.agencyId);
  },
};
