import { adminMetricsRepository } from '../repositories/admin-metrics.repository';

export const adminMetricsService = {
  async getMetrics() {
    return adminMetricsRepository.getMetrics();
  },
};
