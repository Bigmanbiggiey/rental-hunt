import { contactMessageRepository } from '@/entities/contact-message';
import type { ContactMessageFilters } from '@/entities/contact-message';

export const contactMessageAdminService = {
  async list(filters?: ContactMessageFilters) {
    return contactMessageRepository.list(filters);
  },

  async setResolved(id: string, isResolved: boolean) {
    return contactMessageRepository.setResolved(id, isResolved);
  },

  async delete(id: string) {
    return contactMessageRepository.delete(id);
  },
};
