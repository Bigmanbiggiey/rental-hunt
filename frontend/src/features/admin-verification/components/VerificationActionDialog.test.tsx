import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Property } from '@/entities/property';
import { VerificationActionDialog } from './VerificationActionDialog';

/**
 * `fireEvent`, not `userEvent` — matches `CancelBookingDialog.test.tsx`'s
 * established Dialog-testing convention (Sprint 6 found a genuine, non-
 * terminating recursive `focus()` loop between jsdom and
 * `@radix-ui/react-focus-scope` specifically under `userEvent`-driven
 * DropdownMenu-to-Dialog handoffs; rendered directly with `property` as a
 * controlled prop rather than driven through a real DropdownMenu).
 */
const PROPERTY: Property = {
  id: 'property-1',
  slug: 'test-property',
  title: 'Test Property',
  description: 'A test property.',
  agencyId: 'agency-1',
  agentId: 'agent-1',
  propertyTypeId: 'type-1',
  propertyTypeName: 'Apartment',
  countyId: 'county-1',
  countyName: 'Nairobi',
  locationId: 'location-1',
  locationName: 'Kilimani',
  latitude: -1.29,
  longitude: 36.78,
  bedrooms: 2,
  bathrooms: 2,
  rentAmount: 50000,
  depositAmount: 50000,
  currency: 'KES',
  availabilityStatus: 'available',
  verificationStatus: 'pending_verification',
  lastVerifiedAt: null,
  isFeatured: false,
  isArchived: false,
  viewCount: 0,
  images: [],
  amenities: [],
  agent: { id: 'agent-1', fullName: 'Test Agent', avatarUrl: null, jobTitle: null, bio: null, agencyId: 'agency-1' },
  createdAt: '2026-07-31T00:00:00.000Z',
  updatedAt: '2026-07-31T00:00:00.000Z',
};

describe('VerificationActionDialog (component)', () => {
  it('approves without requiring a reason', () => {
    const onSubmit = vi.fn();
    render(<VerificationActionDialog property={PROPERTY} onOpenChange={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /approve/i }));

    expect(onSubmit).toHaveBeenCalledWith({ status: 'verified' });
  });

  it('blocks rejecting with no reason and shows an inline error, without calling onSubmit', () => {
    const onSubmit = vi.fn();
    render(<VerificationActionDialog property={PROPERTY} onOpenChange={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /reject/i }));

    expect(screen.getByText(/a reason is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects with a reason once one is entered', () => {
    const onSubmit = vi.fn();
    render(<VerificationActionDialog property={PROPERTY} onOpenChange={vi.fn()} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/reason/i), {
      target: { value: 'Photos do not match the description.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reject/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      status: 'rejected',
      reason: 'Photos do not match the description.',
    });
  });

  it('does not render when no property is being reviewed', () => {
    render(<VerificationActionDialog property={null} onOpenChange={vi.fn()} onSubmit={vi.fn()} />);

    expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
  });
});
