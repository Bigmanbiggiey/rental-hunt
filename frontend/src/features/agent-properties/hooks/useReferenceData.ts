import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

// Used by PropertyForm's Location combobox "create new" affordance. The
// `locations` queries are `staleTime: Infinity` (reference data rarely
// changes), so a successful create explicitly invalidates every cached
// slice — every countyId-scoped key plus the unscoped one
// `features/property-search` shares — rather than relying on a refetch
// that would never happen on its own.
export function useCreateLocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ countyId, name }: { countyId: string; name: string }) =>
      referenceDataRepository.createLocation(countyId, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reference', 'locations'] });
    },
  });
}
