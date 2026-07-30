import { useQuery } from '@tanstack/react-query';
import { referenceDataRepository } from '@/entities/property';

// Same query keys as `features/property-search/hooks/useReferenceData.ts` —
// deliberately, so both features share one TanStack Query cache entry
// instead of fetching this reference data twice. `features` can't
// cross-import each other (coding-standards.md §3.2), so the thin
// `useQuery` wrapper itself is duplicated; the underlying repository call
// and cache slot are not.
export function useCounties() {
  return useQuery({
    queryKey: ['reference', 'counties'],
    queryFn: () => referenceDataRepository.listCounties(),
    staleTime: Infinity,
  });
}

export function useLocations(countyId?: string) {
  return useQuery({
    queryKey: ['reference', 'locations', countyId],
    queryFn: () => referenceDataRepository.listLocations(countyId),
    staleTime: Infinity,
  });
}

export function usePropertyTypes() {
  return useQuery({
    queryKey: ['reference', 'propertyTypes'],
    queryFn: () => referenceDataRepository.listPropertyTypes(),
    staleTime: Infinity,
  });
}

export function useAmenities() {
  return useQuery({
    queryKey: ['reference', 'amenities'],
    queryFn: () => referenceDataRepository.listAmenities(),
    staleTime: Infinity,
  });
}
