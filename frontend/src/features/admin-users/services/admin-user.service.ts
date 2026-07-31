import { parseOrThrow } from '@/shared/lib/errors';
import { adminUserRepository, type AdminUserFilters } from '../repositories/admin-user.repository';
import { AdminUpdateUserSchema, type AdminUpdateUserFormInput } from '../schemas/adminUpdateUser.schema';

export const adminUserService = {
  async list(filters?: AdminUserFilters, page?: number, pageSize?: number) {
    return adminUserRepository.list(filters, page, pageSize);
  },

  async adminUpdate(id: string, input: AdminUpdateUserFormInput) {
    const parsed = parseOrThrow(AdminUpdateUserSchema, input);
    return adminUserRepository.adminUpdate(id, parsed);
  },
};
