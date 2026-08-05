import { z } from 'zod';

/** api-design.md §23.1; database.md §5.16's `CHECK` constraints are the backstop. */
export const SubmitContactMessageSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters.')
    .max(2000, 'Message must be 2000 characters or fewer.'),
});

export type SubmitContactMessageInput = z.infer<typeof SubmitContactMessageSchema>;
