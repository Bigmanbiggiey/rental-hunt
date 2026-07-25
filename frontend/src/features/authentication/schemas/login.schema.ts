import { z } from 'zod';

/**
 * api-design.md §5.2: no format validation beyond "non-empty" — format
 * errors are folded into the generic INVALID_CREDENTIALS failure so the
 * client never signals which field was wrong.
 */
export const LoginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email.'),
  password: z.string().min(1, 'Enter your password.'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
