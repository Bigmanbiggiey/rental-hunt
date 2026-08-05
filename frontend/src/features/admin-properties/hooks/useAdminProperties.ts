import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { adminPropertiesService } from '../services/admin-properties.service';

export function useAdminProperties(page?: number, pageSize?: number) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['admin', 'properties', page, pageSize],
    queryFn: () => adminPropertiesService.list(page, pageSize),
    enabled: !!profile,
    staleTime: 30_000,
  });
}
