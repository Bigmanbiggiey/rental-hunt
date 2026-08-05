import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/entities/user';
import { currentUserEmailRepository } from '../repositories/currentUserEmail.repository';

/** Pre-fills the Contact form's email field for a signed-in user (CONTENT-002). `null` for a guest. */
export function useCurrentUserEmail() {
  const { profile } = useAuth();

  return useQuery({
    // Deliberately its own key, not `features/profile-management`'s
    // `['auth', 'currentEmail']` — sibling features can't share a query-key
    // constant without a cross-feature import, so this is an intentionally
    // separate cache entry for the same underlying value.
    queryKey: ['contact', 'currentUserEmail'],
    queryFn: () => currentUserEmailRepository.getCurrentEmail(),
    enabled: !!profile,
    staleTime: Infinity,
  });
}
