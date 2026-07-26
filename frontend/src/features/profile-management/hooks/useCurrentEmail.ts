import { useQuery } from '@tanstack/react-query';
import { credentialsService } from '../services/credentials.service';

export const CURRENT_EMAIL_QUERY_KEY = ['auth', 'currentEmail'] as const;

export function useCurrentEmail() {
  return useQuery({
    queryKey: CURRENT_EMAIL_QUERY_KEY,
    queryFn: () => credentialsService.getCurrentEmail(),
    staleTime: Infinity,
  });
}
