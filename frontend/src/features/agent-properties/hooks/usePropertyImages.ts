import { useQuery } from '@tanstack/react-query';
import { propertyImageService } from '../services/property-image.service';

export function usePropertyImages(propertyId: string | undefined) {
  return useQuery({
    queryKey: ['propertyImages', propertyId],
    queryFn: () => propertyImageService.listByProperty(propertyId as string),
    enabled: !!propertyId,
  });
}
