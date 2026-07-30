import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyImageService } from '../services/property-image.service';

export function useReorderPropertyImages(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedImageIds: string[]) => propertyImageService.reorder(propertyId, orderedImageIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
    },
  });
}
