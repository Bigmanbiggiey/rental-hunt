import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { agencyRegistrationService } from '../services/agency-registration.service';

export function useMyAgencyApplication() {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['agencyRegistration', 'myApplication'],
    queryFn: () => agencyRegistrationService.getMyApplication(),
    enabled: !!profile,
    staleTime: 30_000,
  });
}
