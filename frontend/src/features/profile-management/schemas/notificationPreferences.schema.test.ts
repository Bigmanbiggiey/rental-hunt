import { describe, expect, it } from 'vitest';
import { NotificationPreferencesSchema } from './notificationPreferences.schema';

describe('NotificationPreferencesSchema (unit, CUST-004)', () => {
  it('accepts both booleans', () => {
    const result = NotificationPreferencesSchema.safeParse({
      bookingUpdates: true,
      promotionalUpdates: false,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-boolean value', () => {
    const result = NotificationPreferencesSchema.safeParse({
      bookingUpdates: true,
      promotionalUpdates: 'yes',
    });
    expect(result.success).toBe(false);
  });
});
