import { viewingRequestRepository } from '@/entities/viewing-request';

/** Epic 12's Admin Overview "Bookings this week" drill-down — thin passthrough, no user input beyond pagination. */
export const adminBookingsService = {
  async list(page?: number, pageSize?: number) {
    return viewingRequestRepository.listAllAdmin(page, pageSize);
  },
};
