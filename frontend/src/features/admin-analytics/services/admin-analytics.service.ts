import { adminAnalyticsRepository, type AdminAnalyticsRange } from '../repositories/admin-analytics.repository';

export const adminAnalyticsService = {
  async getAnalytics(range: AdminAnalyticsRange) {
    return adminAnalyticsRepository.getAnalytics(range);
  },
};
