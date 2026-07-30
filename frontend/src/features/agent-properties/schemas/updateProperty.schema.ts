import { z } from 'zod';
import { CreatePropertySchema } from './createProperty.schema';

/** AGENT-003: "changes are validated using the same rules as creation" — a `Partial` variant since an edit may touch only some fields. */
export const UpdatePropertySchema = CreatePropertySchema.partial();

export type UpdatePropertyFormInput = z.infer<typeof UpdatePropertySchema>;
