import { propertyRepository } from '@/entities/property';

/** Epic 12's Admin Overview "Total properties" drill-down — thin passthrough, no user input beyond pagination. */
export const adminPropertiesService = {
  async list(page?: number, pageSize?: number) {
    return propertyRepository.listAllAdmin(page, pageSize);
  },
};
