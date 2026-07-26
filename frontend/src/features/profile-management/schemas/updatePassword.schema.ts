import { z } from 'zod';
import { passwordSchema } from '@/entities/user';

/** api-design.md §5.10 — same password rules as registration. */
export const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, 'Confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords do not match.',
    path: ['confirmNewPassword'],
  });

export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;
