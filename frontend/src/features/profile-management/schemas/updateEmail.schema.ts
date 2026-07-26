import { z } from 'zod';

/** api-design.md §5.9. */
export const UpdateEmailSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email('Enter a valid email address.'),
});

export type UpdateEmailInput = z.infer<typeof UpdateEmailSchema>;
