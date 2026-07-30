import { describe, expect, it } from 'vitest';
import { CreatePropertySchema } from './createProperty.schema';

const VALID = {
  title: 'Modern 2BR Apartment in Kilimani',
  description: 'A bright, modern 2-bedroom apartment close to shops and restaurants.',
  propertyTypeId: 'cbe283f4-f13f-46e1-a98d-6d4d3c87962c',
  countyId: '49515d50-6a2d-4d88-bae9-b1ad0e38b05a',
  locationId: '5e183fcf-c9c4-4124-93b3-77f781fdfcda',
  latitude: -1.29,
  longitude: 36.78,
  bedrooms: 2,
  bathrooms: 2,
  rentAmount: 55000,
  depositAmount: 55000,
  amenityIds: [],
  availabilityStatus: 'available' as const,
};

describe('CreatePropertySchema (unit)', () => {
  it('accepts a fully valid payload', () => {
    expect(CreatePropertySchema.safeParse(VALID).success).toBe(true);
  });

  it('rejects a title under 5 characters', () => {
    const result = CreatePropertySchema.safeParse({ ...VALID, title: 'Hi' });
    expect(result.success).toBe(false);
  });

  it('rejects a description under 20 characters', () => {
    const result = CreatePropertySchema.safeParse({ ...VALID, description: 'Too short.' });
    expect(result.success).toBe(false);
  });

  it('rejects latitude/longitude outside Kenya’s bounding box', () => {
    expect(CreatePropertySchema.safeParse({ ...VALID, latitude: 50 }).success).toBe(false);
    expect(CreatePropertySchema.safeParse({ ...VALID, longitude: 100 }).success).toBe(false);
  });

  it('rejects a non-positive rentAmount', () => {
    expect(CreatePropertySchema.safeParse({ ...VALID, rentAmount: 0 }).success).toBe(false);
  });

  it('rejects a negative depositAmount', () => {
    expect(CreatePropertySchema.safeParse({ ...VALID, depositAmount: -1 }).success).toBe(false);
  });

  it('rejects more than 20 amenities', () => {
    const amenityIds = Array.from({ length: 21 }, (_, i) => `${i}`.padStart(8, '0') + '-0000-0000-0000-000000000000');
    expect(CreatePropertySchema.safeParse({ ...VALID, amenityIds }).success).toBe(false);
  });

  it('rejects an invalid availabilityStatus', () => {
    const result = CreatePropertySchema.safeParse({ ...VALID, availabilityStatus: 'sold' });
    expect(result.success).toBe(false);
  });
});
