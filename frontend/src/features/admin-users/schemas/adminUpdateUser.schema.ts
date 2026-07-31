import { z } from 'zod';

/** api-design.md §9's "Manage Users" `adminUpdate(id, { role?, isActive? })`. */
export const AdminUpdateUserSchema = z
  .object({
    role: z.enum(['customer', 'agent', 'moderator', 'admin']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => value.role !== undefined || value.isActive !== undefined, {
    message: 'At least one field must be provided.',
  });

export type AdminUpdateUserFormInput = z.input<typeof AdminUpdateUserSchema>;
