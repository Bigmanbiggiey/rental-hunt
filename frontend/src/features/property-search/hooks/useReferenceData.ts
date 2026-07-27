import { useQuery } from '@tanstack/react-query';
import { referenceDataRepository } from '@/entities/property';

// Reference data (database.md §4.4) — staleTime Infinity, per coding-standards.md's caching table.
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
