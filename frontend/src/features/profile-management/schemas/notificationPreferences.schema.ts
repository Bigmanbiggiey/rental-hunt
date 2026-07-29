import { z } from 'zod';

/** CUST-004. */
export const NotificationPreferencesSchema = z.object({
  bookingUpdates: z.boolean(),
  promotionalUpdates: z.boolean(),
});

export type NotificationPreferencesInput = z.infer<typeof NotificationPreferencesSchema>;
