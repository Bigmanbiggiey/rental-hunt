import { z } from 'zod';
import { fullNameSchema, phoneSchema } from '@/entities/user';

/**
 * api-design.md §9's "Manage Users" `adminUpdate(id, { role?, isActive?, fullName?, phone? })`.
 * `fullName`/`phone` added post-Sprint-8 (2026-08-04) — plain `profiles`
 * columns admin already has full RLS access to (`profiles_update_all_admin`,
 * database.md §9's "Full CRUD" row), so this extends the existing
 * Repository/RLS path rather than needing a new Edge Function the way
 * invite/delete do (those touch `auth.users`, which RLS can't reach).
 * `phone` stays optional/nullable — not every profile has one.
 */
export const AdminUpdateUserSchema = z
  .object({
    role: z.enum(['customer', 'agent', 'moderator', 'admin']).optional(),
    isActive: z.boolean().optional(),
    fullName: fullNameSchema.optional(),
    phone: z.union([phoneSchema, z.literal('')]).optional(),
  })
  .refine(
    (value) =>
      value.role !== undefined ||
      value.isActive !== undefined ||
      value.fullName !== undefined ||
      value.phone !== undefined,
    { message: 'At least one field must be provided.' },
  );

export type AdminUpdateUserFormInput = z.input<typeof AdminUpdateUserSchema>;

/**
 * A standalone schema for EditUserDetailsDialog's fullName/phone-only form —
 * deliberately not `AdminUpdateUserSchema.pick(...)`. Found via real manual
 * testing (2026-08-04, not caught by typecheck): Zod throws at *runtime*
 * ("`.pick()` cannot be used on object schemas containing refinements") the
 * moment a schema built with `.refine()` is picked from, since a refinement
 * can reference fields the pick might drop. TypeScript has no way to catch
 * this — the resulting type looked fine, the app just crashed the first
 * time this dialog actually rendered.
 */
export const EditUserDetailsSchema = z.object({
  fullName: fullNameSchema,
  phone: z.union([phoneSchema, z.literal('')]),
});

export type EditUserDetailsFormInput = z.infer<typeof EditUserDetailsSchema>;
