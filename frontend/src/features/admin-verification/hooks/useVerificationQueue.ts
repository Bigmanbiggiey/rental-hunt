import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { adminVerificationService } from '../services/admin-verification.service';

/** roadmap.md §11 — the moderator/admin verification queue. */
export function useVerificationQueue(page?: number, pageSize?: number) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['properties', 'verification', 'pending', page, pageSize],
    queryFn: () => adminVerificationService.listPending(page, pageSize),
    enabled: !!profile,
    staleTime: 30_000,
  });
}
