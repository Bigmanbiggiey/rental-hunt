import { z } from 'zod';

/** api-design.md §9's "Manage Users" `invite({ email, fullName, role })` — the admin-invite-user Edge Function re-validates the same shape server-side, per coding-standards.md's "Zod at the Service layer... never one without the other." */
export const InviteUserSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters.').max(150, 'Full name must be 150 characters or fewer.'),
  role: z.enum(['customer', 'agent', 'moderator', 'admin'], { message: 'Choose a role.' }),
});

export type InviteUserFormInput = z.infer<typeof InviteUserSchema>;
