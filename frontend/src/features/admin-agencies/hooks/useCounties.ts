import { useQuery } from '@tanstack/react-query';
import { referenceDataRepository } from '@/entities/property';

// Same query key as `features/agent-properties/hooks/useReferenceData.ts`'s
// `useCounties()` — deliberately, so both features share one TanStack Query
// cache entry rather than fetching this reference data twice. `features`
// can't cross-import each other (coding-standards.md §3.2), so the thin
// wrapper is duplicated, not the underlying repository call/cache slot.
export function useCounties() {
  return useQuery({
    queryKey: ['reference', 'counties'],
    queryFn: () => referenceDataRepository.listCounties(),
    staleTime: Infinity,
  });
}
