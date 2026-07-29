import { z } from 'zod';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** api-design.md §8.2/§14 (VIEW-001/VIEW-002). */
export const CreateViewingRequestSchema = z.object({
  requestedDate: z
    .string()
    .min(1, 'Choose a date.')
    .refine((value) => value >= today(), 'Choose today or a future date.'),
  requestedTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Enter a valid time.'),
  notes: z
    .string()
    .max(500, 'Notes must be 500 characters or fewer.')
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed ? trimmed : undefined;
    }),
});

// z.input, not z.infer/z.output — the schema's `notes` transform makes the
// output key non-optional (`string | undefined`), which zodResolver's form
// generic rejects; the raw pre-transform shape (`notes?: string`) is what
// the form/hook/service boundary actually passes around and validates.
export type CreateViewingRequestInput = z.input<typeof CreateViewingRequestSchema>;
