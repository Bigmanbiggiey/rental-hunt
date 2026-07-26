import { z } from 'zod';
import { fullNameSchema, passwordSchema } from '@/entities/user';

/** api-design.md §14. */
export const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: passwordSchema,
  fullName: fullNameSchema,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
