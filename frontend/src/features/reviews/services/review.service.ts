import { parseOrThrow } from '@/shared/lib/errors';
import { reviewRepository } from '@/entities/review';
import { CreateReviewSchema, type CreateReviewFormInput } from '../schemas/createReview.schema';

export const reviewService = {
  async create(input: CreateReviewFormInput) {
    const parsed = parseOrThrow(CreateReviewSchema, input);
    return reviewRepository.create(parsed);
  },
};
