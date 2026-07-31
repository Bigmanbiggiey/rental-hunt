import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { adminAgencyService } from '../services/admin-agency.service';

export function useAdminAgencies() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['admin', 'agencies'],
    queryFn: () => adminAgencyService.list(),
    enabled: !!profile,
    staleTime: 30_000,
  });
}
