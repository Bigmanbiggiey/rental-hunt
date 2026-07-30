import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppError } from '@/shared/lib/errors';
import { useAuth } from '@/entities/user';
import { agentPropertyService } from '../services/agent-property.service';
import type { CreatePropertyFormInput } from '../schemas/createProperty.schema';

export function useCreateProperty() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePropertyFormInput) => {
      if (!profile) throw new AppError('UNAUTHENTICATED', 'Please sign in to continue.');
      return agentPropertyService.create(profile.id, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['properties', 'agent'] });
    },
  });
}
