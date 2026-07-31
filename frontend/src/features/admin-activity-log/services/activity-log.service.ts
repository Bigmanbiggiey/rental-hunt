import { activityLogRepository, type ActivityLogFilters } from '../repositories/activity-log.repository';

export const activityLogService = {
  async list(filters?: ActivityLogFilters, page?: number, pageSize?: number) {
    return activityLogRepository.list(filters, page, pageSize);
  },

  async delete(id: string) {
    return activityLogRepository.delete(id);
  },
};
