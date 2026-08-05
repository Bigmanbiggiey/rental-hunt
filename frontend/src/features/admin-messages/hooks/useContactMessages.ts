import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import type { ContactMessageFilters } from '@/entities/contact-message';
import { contactMessageAdminService } from '../services/contact-message-admin.service';

export function useContactMessages(filters?: ContactMessageFilters) {
  const { profile } = useAuth();

  return useQuery({
    queryKey: ['admin', 'contactMessages', filters],
    queryFn: () => contactMessageAdminService.list(filters),
    enabled: !!profile,
    staleTime: 30_000,
  });
}
