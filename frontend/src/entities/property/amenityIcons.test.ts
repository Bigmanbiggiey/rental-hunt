import { describe, expect, it } from 'vitest';
import { Car, HelpCircle } from 'lucide-react';
import { getAmenityIcon } from './amenityIcons';

describe('getAmenityIcon (unit)', () => {
  it('maps a known seeded icon key to its component', () => {
    expect(getAmenityIcon('car')).toBe(Car);
  });

  it('falls back to HelpCircle for an unmapped icon key, rather than crashing', () => {
    expect(getAmenityIcon('some-future-amenity-icon')).toBe(HelpCircle);
  });

  it('falls back to HelpCircle for null', () => {
    expect(getAmenityIcon(null)).toBe(HelpCircle);
  });
});
