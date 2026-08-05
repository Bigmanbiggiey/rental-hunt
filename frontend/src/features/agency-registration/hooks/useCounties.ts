import { useQuery } from '@tanstack/react-query';
import { referenceDataRepository } from '@/entities/property';

// Same query key as `features/admin-agencies`/`features/agent-properties`'s
// own `useCounties()` — one shared TanStack Query cache entry, per that
// feature's own precedent for this cross-feature duplication
// (`features` can't cross-import each other, coding-standards.md §3.2).
export function useCounties() {
  return useQuery({
    queryKey: ['reference', 'counties'],
    queryFn: () => referenceDataRepository.listCounties(),
    staleTime: Infinity,
  });
}
