import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { PropertyCard, type PropertyCardFavoriteProps } from './PropertyCard';
import type { Property } from './property.types';

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
  images: [
    {
      id: 'img1',
      propertyId: 'p1',
      imageUrl: 'https://x/1.jpg',
      altText: 'front',
      displayOrder: 0,
    },
  ],
  amenities: [{ id: 'am1', name: 'WiFi', icon: 'wifi' }],
  agent: {
    id: 'agent1',
    fullName: 'James Mwangi',
    avatarUrl: null,
    jobTitle: 'Leasing Agent',
    bio: null,
    agencyId: 'ag1',
    agencyName: 'Nairobi Homes',
  },
  createdAt: '2026-07-20T00:00:00.000Z',
  updatedAt: '2026-07-20T00:00:00.000Z',
};

function renderCard(
  property: Property = PROPERTY,
  favorite: PropertyCardFavoriteProps = { isSaved: false, isPending: false, onToggle: vi.fn() },
) {
  return render(
    <MemoryRouter>
      <PropertyCard property={property} favorite={favorite} />
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
    renderCard({
      ...PROPERTY,
      availabilityStatus: 'reserved',
      verificationStatus: 'pending_verification',
    });
    expect(screen.getByText('Reserved')).toBeInTheDocument();
    expect(screen.getByText('Pending Verification')).toBeInTheDocument();
  });

  it('renders an Archived badge only when the property is archived (FAV-003)', () => {
    renderCard();
    expect(screen.queryByText('Archived')).not.toBeInTheDocument();

    renderCard({ ...PROPERTY, isArchived: true });
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('forwards the favorite prop bundle to FavoriteButton, which never navigates', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderCard(PROPERTY, { isSaved: false, isPending: false, onToggle });

    const favoriteButton = screen.getByRole('button', { name: /save property/i });
    expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(favoriteButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
    // Still on the card, not navigated away.
    expect(screen.getByRole('link')).toHaveAttribute('href', '/properties/test-2br-kilimani');
  });
});
