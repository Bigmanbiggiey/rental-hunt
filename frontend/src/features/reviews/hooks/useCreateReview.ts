import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateReviewFormInput } from '../schemas/createReview.schema';
import { reviewService } from '../services/review.service';

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateReviewFormInput) => reviewService.create(input),
    onSuccess: (review) => {
      void queryClient.invalidateQueries({ queryKey: ['agencies', 'reviews', review.agencyId] });
      void queryClient.invalidateQueries({ queryKey: ['agencies', 'ratingSummary', review.agencyId] });
      if (review.agentId) {
        void queryClient.invalidateQueries({ queryKey: ['agents', 'ratingSummary', review.agentId] });
      }
    },
  });
}
