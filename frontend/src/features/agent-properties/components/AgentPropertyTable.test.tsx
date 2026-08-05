import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Property } from '@/entities/property';
import { AgentPropertyTable } from './AgentPropertyTable';

const mockArchiveMutate = vi.fn();
vi.mock('../hooks/useArchiveProperty', () => ({
  useArchiveProperty: () => ({ mutate: mockArchiveMutate, isPending: false }),
}));

const mockAvailabilityMutate = vi.fn();
vi.mock('../hooks/useUpdateAvailability', () => ({
  useUpdateAvailability: () => ({ mutate: mockAvailabilityMutate, isPending: false }),
}));

const BASE_PROPERTY: Property = {
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
  verificationStatus: 'unverified',
  lastVerifiedAt: null,
  isFeatured: false,
  isArchived: false,
  viewCount: 3,
  images: [],
  amenities: [],
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

describe('AgentPropertyTable (component)', () => {
  it('renders the property title, verification badge, and view count in the desktop table', () => {
    render(<AgentPropertyTable properties={[BASE_PROPERTY]} onEdit={vi.fn()} />);

    const table = screen.getByRole('table');
    expect(within(table).getByText('Test 2BR in Kilimani')).toBeInTheDocument();
    expect(within(table).getByText('Unverified')).toBeInTheDocument();
    expect(within(table).getByText('3')).toBeInTheDocument();
  });

  it('shows an Archived badge only when the property is archived', () => {
    const { rerender } = render(<AgentPropertyTable properties={[BASE_PROPERTY]} onEdit={vi.fn()} />);
    expect(screen.queryByText('Archived')).not.toBeInTheDocument();

    rerender(<AgentPropertyTable properties={[{ ...BASE_PROPERTY, isArchived: true }]} onEdit={vi.fn()} />);
    expect(screen.getAllByText('Archived').length).toBeGreaterThan(0);
  });

  it('calls onEdit with the property id when Edit is selected from the row menu', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<AgentPropertyTable properties={[BASE_PROPERTY]} onEdit={onEdit} />);

    const menuButtons = screen.getAllByRole('button', { name: /actions for test 2br in kilimani/i });
    await user.click(menuButtons[0]!);
    await user.click(await screen.findByText('Edit'));

    expect(onEdit).toHaveBeenCalledWith('p1');
  });

  it('calls the archive mutation with archived: true for a non-archived property', async () => {
    const user = userEvent.setup();
    render(<AgentPropertyTable properties={[BASE_PROPERTY]} onEdit={vi.fn()} />);

    const menuButtons = screen.getAllByRole('button', { name: /actions for test 2br in kilimani/i });
    await user.click(menuButtons[0]!);
    await user.click(await screen.findByText('Archive'));

    expect(mockArchiveMutate).toHaveBeenCalledWith({ id: 'p1', archived: true });
  });

  it('calls the archive mutation with archived: false (un-archive) for an already-archived property', async () => {
    const user = userEvent.setup();
    render(<AgentPropertyTable properties={[{ ...BASE_PROPERTY, isArchived: true }]} onEdit={vi.fn()} />);

    const menuButtons = screen.getAllByRole('button', { name: /actions for test 2br in kilimani/i });
    await user.click(menuButtons[0]!);
    await user.click(await screen.findByText('Unarchive'));

    expect(mockArchiveMutate).toHaveBeenCalledWith({ id: 'p1', archived: false });
  });
});
