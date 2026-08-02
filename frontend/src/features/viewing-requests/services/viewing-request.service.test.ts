import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Property } from '@/entities/property';

const mockCreate = vi.fn();
const mockCountRecentByCustomer = vi.fn();
const mockCancel = vi.fn();
const mockListForCustomer = vi.fn();

vi.mock('@/entities/viewing-request', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/entities/viewing-request')>();
  return {
    ...actual,
    viewingRequestRepository: {
      create: mockCreate,
      countRecentByCustomer: mockCountRecentByCustomer,
      cancel: mockCancel,
      listForCustomer: mockListForCustomer,
    },
  };
});

const { viewingRequestService } = await import('./viewing-request.service');

function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: 'p1',
    slug: 'test-property',
    title: 'Test Property',
    description: 'A test property.',
    agencyId: 'ag1',
    agentId: 'a1',
    propertyTypeId: 'pt1',
    propertyTypeName: 'Apartment',
    countyId: 'c1',
    countyName: 'Nairobi',
    locationId: 'l1',
    locationName: 'Kilimani',
    latitude: -1.29,
    longitude: 36.78,
    bedrooms: 2,
    bathrooms: 1,
    rentAmount: 40000,
    depositAmount: 40000,
    currency: 'KES',
    availabilityStatus: 'available',
    verificationStatus: 'verified',
    lastVerifiedAt: null,
    isFeatured: false,
    isArchived: false,
    viewCount: 0,
    images: [],
    amenities: [],
    agent: { id: 'a1', fullName: 'Test Agent', avatarUrl: null, jobTitle: null, bio: null, agencyId: 'ag1' },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('viewingRequestService.create() — rate limiting (api-design.md §18)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects with RATE_LIMITED at 10 recent requests, without calling the Repository create', async () => {
    mockCountRecentByCustomer.mockResolvedValueOnce(10);

    await expect(
      viewingRequestService.create(makeProperty(), { requestedDate: '2099-01-01', requestedTime: '10:00' }),
    ).rejects.toMatchObject({ code: 'RATE_LIMITED' });

    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('allows creation at 9 recent requests', async () => {
    mockCountRecentByCustomer.mockResolvedValueOnce(9);
    mockCreate.mockResolvedValueOnce({ id: 'vr1' });

    await viewingRequestService.create(makeProperty(), {
      requestedDate: '2099-01-01',
      requestedTime: '10:00',
    });

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it('still rejects an unavailable property with PROPERTY_NOT_AVAILABLE when under the rate limit', async () => {
    mockCountRecentByCustomer.mockResolvedValueOnce(0);

    await expect(
      viewingRequestService.create(makeProperty({ availabilityStatus: 'occupied' }), {
        requestedDate: '2099-01-01',
        requestedTime: '10:00',
      }),
    ).rejects.toMatchObject({ code: 'PROPERTY_NOT_AVAILABLE' });

    expect(mockCreate).not.toHaveBeenCalled();
  });
});
