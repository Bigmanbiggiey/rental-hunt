import { describe, expect, it } from 'vitest';
import { mapCountyRow, mapLocationRow, mapPropertyRow, mapPropertyTypeRow } from './property.mapper';
import type { PropertyRow } from './property.mapper';

const BASE_ROW: PropertyRow = {
  id: 'p1',
  slug: 'test-property',
  title: 'Test Property',
  description: 'A description',
  agency_id: 'ag1',
  agent_id: 'agent1',
  property_type_id: 'pt1',
  county_id: 'c1',
  location_id: 'l1',
  latitude: -1.29,
  longitude: 36.78,
  bedrooms: 2,
  bathrooms: 1,
  rent_amount: 55000,
  deposit_amount: 55000,
  currency: 'KES',
  availability_status: 'available',
  verification_status: 'verified',
  last_verified_at: '2026-07-20T00:00:00.000Z',
  is_featured: true,
  is_archived: false,
  view_count: 3,
  created_at: '2026-07-20T00:00:00.000Z',
  updated_at: '2026-07-20T00:00:00.000Z',
  property_type: { name: 'Apartment' },
  county: { name: 'Nairobi' },
  location: { name: 'Kilimani' },
  images: [
    { id: 'img2', image_url: 'https://x/2.jpg', alt_text: null, display_order: 1 },
    { id: 'img1', image_url: 'https://x/1.jpg', alt_text: 'front', display_order: 0 },
  ],
  amenities: [{ amenity: { id: 'am1', name: 'WiFi', icon: 'wifi' } }],
  agent: {
    agent_id: 'agent1',
    agency_id: 'ag1',
    full_name: 'James Mwangi',
    avatar_url: null,
    job_title: 'Leasing Agent',
    bio: 'Bio',
    agency_name: 'Nairobi Homes',
  },
};

describe('mapPropertyRow (unit)', () => {
  it('maps every snake_case field to its camelCase Property equivalent', () => {
    const property = mapPropertyRow(BASE_ROW);
    expect(property).toMatchObject({
      id: 'p1',
      slug: 'test-property',
      propertyTypeName: 'Apartment',
      countyName: 'Nairobi',
      locationName: 'Kilimani',
      rentAmount: 55000,
      availabilityStatus: 'available',
      verificationStatus: 'verified',
      isFeatured: true,
      isArchived: false,
    });
  });

  it('sorts images by displayOrder regardless of the order the query returned them in', () => {
    const property = mapPropertyRow(BASE_ROW);
    expect(property.images.map((i) => i.id)).toEqual(['img1', 'img2']);
  });

  it('flattens the property_amenities junction shape into a plain Amenity list', () => {
    const property = mapPropertyRow(BASE_ROW);
    expect(property.amenities).toEqual([{ id: 'am1', name: 'WiFi', icon: 'wifi' }]);
  });

  it('maps the embedded agent_directory row to the public-safe PropertyAgent shape', () => {
    const property = mapPropertyRow(BASE_ROW);
    expect(property.agent).toEqual({
      id: 'agent1',
      fullName: 'James Mwangi',
      avatarUrl: null,
      jobTitle: 'Leasing Agent',
      bio: 'Bio',
      agencyId: 'ag1',
      agencyName: 'Nairobi Homes',
    });
  });

  it('degrades to empty placeholders rather than throwing when a joined row is null', () => {
    const property = mapPropertyRow({
      ...BASE_ROW,
      property_type: null,
      county: null,
      location: null,
      agent: null,
    });
    expect(property.propertyTypeName).toBe('');
    expect(property.countyName).toBe('');
    expect(property.locationName).toBe('');
    expect(property.agent.fullName).toBe('');
  });
});

describe('reference-data row mappers (unit)', () => {
  it('mapCountyRow/mapLocationRow/mapPropertyTypeRow map straightforwardly', () => {
    expect(mapCountyRow({ id: 'c1', name: 'Nairobi' })).toEqual({ id: 'c1', name: 'Nairobi' });
    expect(mapLocationRow({ id: 'l1', county_id: 'c1', name: 'Kilimani' })).toEqual({
      id: 'l1',
      countyId: 'c1',
      name: 'Kilimani',
    });
    expect(mapPropertyTypeRow({ id: 'pt1', name: 'Apartment' })).toEqual({ id: 'pt1', name: 'Apartment' });
  });
});
