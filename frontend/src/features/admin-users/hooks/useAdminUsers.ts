import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import type { AdminUserFilters } from '../repositories/admin-user.repository';
import { adminUserService } from '../services/admin-user.service';

export function useAdminUsers(filters?: AdminUserFilters, page?: number, pageSize?: number) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['admin', 'users', filters, page, pageSize],
    queryFn: () => adminUserService.list(filters, page, pageSize),
    enabled: !!profile,
    staleTime: 30_000,
  });
}
