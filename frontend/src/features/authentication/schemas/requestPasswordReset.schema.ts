import { z } from 'zod';

/** api-design.md §5.5. */
export const RequestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
});

export type RequestPasswordResetInput = z.infer<typeof RequestPasswordResetSchema>;
