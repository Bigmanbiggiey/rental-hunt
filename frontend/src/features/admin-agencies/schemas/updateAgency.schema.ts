import { z } from 'zod';
import { CreateAgencySchema } from './createAgency.schema';

export const UpdateAgencySchema = CreateAgencySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateAgencyFormInput = z.input<typeof UpdateAgencySchema>;
