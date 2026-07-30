import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyImageService } from '../services/property-image.service';

export function useDeletePropertyImage(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (imageId: string) => propertyImageService.delete(imageId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
    },
  });
}
