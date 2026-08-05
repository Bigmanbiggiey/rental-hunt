import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Property } from '@/entities/property';
import { BookingRequestDialog } from './BookingRequestDialog';

const mockCreate = vi.fn();

vi.mock('../services/viewing-request.service', () => ({
  viewingRequestService: { create: (...args: unknown[]) => mockCreate(...args) },
}));

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
    agent: {
      id: 'a1',
      fullName: 'Test Agent',
      avatarUrl: null,
      jobTitle: null,
      bio: null,
      agencyId: 'ag1',
      agencyName: 'Test Agency',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function renderDialog(property = makeProperty()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <BookingRequestDialog open onOpenChange={vi.fn()} property={property} />
    </QueryClientProvider>,
  );
}

/**
 * VIEW-001/002/003. `viewingRequestService.create` is mocked so this stays a
 * fast component test of the form/picker wiring — real RLS-sensitive
 * booking-creation behavior is covered separately (coding-standards.md §19).
 */
describe('BookingRequestDialog (component)', () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it('submits the entered date and time', async () => {
    const user = userEvent.setup();
    mockCreate.mockResolvedValueOnce({ id: 'vr1' });
    renderDialog();

    // Same proven interaction pattern as RescheduleBookingDialog.test.tsx —
    // see that file's comment for why each key press is individually
    // awaited (Radix Select's focus-move is deferred via `setTimeout`).
    await user.click(screen.getByLabelText(/preferred date/i));
    await user.click(screen.getByRole('button', { name: /go to the next month/i }));
    await user.click(screen.getByRole('button', { name: /15/ }));

    await user.click(screen.getByLabelText(/preferred time/i));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[1]!);
    await user.keyboard('{Enter}');

    await user.click(screen.getByRole('button', { name: /send request/i }));

    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    const [, input] = mockCreate.mock.calls[0]!;
    expect(input.requestedTime).toBe('02:00');
    expect(input.requestedDate).toMatch(/^\d{4}-\d{2}-15$/);
  });

  it('does not submit when a required field is missing', async () => {
    renderDialog();

    // Both date and time are required and empty, so both show a FieldError
    // (role="alert") at once — asserted by id, not text, since the
    // DatePicker's own placeholder text is also "Choose a date" and there
    // are two alerts on screen simultaneously.
    await userEvent.setup().click(screen.getByRole('button', { name: /send request/i }));

    await waitFor(() =>
      expect(document.getElementById('requestedDate-error')).toHaveTextContent(/choose a date/i),
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
