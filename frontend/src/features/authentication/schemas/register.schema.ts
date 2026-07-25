import { z } from 'zod';
import { fullNameSchema } from '@/entities/user';

/** api-design.md §14. */
export const RegisterSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Za-z]/, 'Password must include a letter.')
    .regex(/[0-9]/, 'Password must include a number.'),
  fullName: fullNameSchema,
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
