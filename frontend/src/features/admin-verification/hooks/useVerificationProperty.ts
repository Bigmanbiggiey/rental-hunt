import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { adminVerificationService } from '../services/admin-verification.service';

/** Backs the review page — the full listing a moderator/admin is deciding on. */
export function useVerificationProperty(propertyId: string) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['properties', 'verification', 'detail', propertyId],
    queryFn: () => adminVerificationService.getById(propertyId),
    enabled: !!profile && !!propertyId,
  });
}
