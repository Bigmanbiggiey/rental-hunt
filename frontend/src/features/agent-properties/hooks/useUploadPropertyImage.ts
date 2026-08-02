import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCurrentAgent } from '@/entities/agent';
import { AppError } from '@/shared/lib/errors';
import { propertyImageService } from '../services/property-image.service';

export function useUploadPropertyImage(propertyId: string) {
  const queryClient = useQueryClient();
  const { data: agent } = useCurrentAgent();

  return useMutation({
    mutationFn: ({ file, altText }: { file: File; altText?: string }) => {
      if (!agent) {
        throw new AppError('UNAUTHENTICATED', 'Please sign in to continue.');
      }
      return propertyImageService.upload(propertyId, file, agent.id, altText);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['propertyImages', propertyId] });
    },
  });
}
