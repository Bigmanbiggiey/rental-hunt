import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyImageService } from '../services/property-image.service';

export function useUploadPropertyImage(propertyId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, altText }: { file: File; altText?: string }) =>
      propertyImageService.upload(propertyId, file, altText),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
    },
  });
}
