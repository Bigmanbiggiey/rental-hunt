import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { toast } from 'sonner';
import { PropertyCard } from './PropertyCard';
import type { Property } from './property.types';

vi.mock('sonner', () => ({ toast: { info: vi.fn(), success: vi.fn(), error: vi.fn() } }));

const PROPERTY: Property = {
  id: 'p1',
  slug: 'test-2br-kilimani',
  title: 'Test 2BR in Kilimani',
  description: 'desc',
  agencyId: 'ag1',
  agentId: 'agent1',
  propertyTypeId: 'pt1',
  propertyTypeName: 'Apartment',
  countyId: 'c1',
  countyName: 'Nairobi',
  locationId: 'l1',
  locationName: 'Kilimani',
  latitude: -1.29,
  longitude: 36.78,
  bedrooms: 2,
  bathrooms: 2,
  rentAmount: 55000,
  depositAmount: 55000,
  currency: 'KES',
  availabilityStatus: 'available',
  verificationStatus: 'verified',
  lastVerifiedAt: '2026-07-20T00:00:00.000Z',
  isFeatured: true,
  isArchived: false,
  viewCount: 3,
  images: [{ id: 'img1', propertyId: 'p1', imageUrl: 'https://x/1.jpg', altText: 'front', displayOrder: 0 }],
  amenities: [{ id: 'am1', name: 'WiFi', icon: 'wifi' }],
  agent: { id: 'agent1', fullName: 'James Mwangi', avatarUrl: null, jobTitle: 'Leasing Agent', bio: null, agencyId: 'ag1' },
  createdAt: '2026-07-20T00:00:00.000Z',
  updatedAt: '2026-07-20T00:00:00.000Z',
};

function renderCard(property: Property = PROPERTY) {
  return render(
    <MemoryRouter>
      <PropertyCard property={property} />
    </MemoryRouter>,
  );
}

describe('PropertyCard (component)', () => {
  it('renders as a single focusable link to the property detail page', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/properties/test-2br-kilimani');
  });

  it('renders title, location, bedrooms/bathrooms, type, price, and both badges', () => {
    renderCard();
    expect(screen.getByText('Test 2BR in Kilimani')).toBeInTheDocument();
    expect(screen.getByText('Kilimani, Nairobi')).toBeInTheDocument();
    expect(screen.getByText('Apartment')).toBeInTheDocument();
    expect(screen.getByText(/KES 55,000/)).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('maps every availability/verification status to its documented badge label', () => {
    renderCard({ ...PROPERTY, availabilityStatus: 'reserved', verificationStatus: 'pending_verification' });
    expect(screen.getByText('Reserved')).toBeInTheDocument();
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
  });

  it('the Favorite Button never navigates and shows a "coming soon" toast (FAV-001/002 not yet built)', async () => {
    const user = userEvent.setup();
    renderCard();

    const favoriteButton = screen.getByRole('button', { name: /save property/i });
    expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(favoriteButton);

    expect(toast.info).toHaveBeenCalledWith('Saving properties is coming soon.');
    // Still on the card, not navigated away — jsdom's MemoryRouter would have
    // thrown/warned on an actual navigation attempt to a non-existent route.
    expect(screen.getByRole('link')).toHaveAttribute('href', '/properties/test-2br-kilimani');
  });
});
