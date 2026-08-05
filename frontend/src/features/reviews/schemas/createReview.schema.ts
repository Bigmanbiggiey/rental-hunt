import { z } from 'zod';

/** api-design.md §13's `CreateReviewInput`. `viewingRequestId` comes from the calling card, not a form field. */
export const CreateReviewSchema = z.object({
  viewingRequestId: z.string().uuid(),
  rating: z.number().int().min(1, 'Choose a rating.').max(5, 'Choose a rating between 1 and 5.'),
  comment: z.string().trim().max(2000, 'Comment must be 2000 characters or fewer.').optional(),
});

export type CreateReviewFormInput = z.input<typeof CreateReviewSchema>;
