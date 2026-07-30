import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import type { ViewingRequest } from '@/entities/viewing-request';
import { AgentBookingQueue } from './AgentBookingQueue';

const mockConfirmMutate = vi.fn();
vi.mock('../hooks/useConfirmViewingRequest', () => ({
  useConfirmViewingRequest: () => ({ mutate: mockConfirmMutate, isPending: false }),
}));

const mockRescheduleMutate = vi.fn();
vi.mock('../hooks/useRescheduleViewingRequest', () => ({
  useRescheduleViewingRequest: () => ({ mutate: mockRescheduleMutate, isPending: false, error: null }),
}));

const mockCancelMutate = vi.fn();
vi.mock('../hooks/useCancelViewingRequestAgent', () => ({
  useCancelViewingRequestAgent: () => ({ mutate: mockCancelMutate, isPending: false }),
}));

const mockCompleteMutate = vi.fn();
vi.mock('../hooks/useCompleteViewingRequest', () => ({
  useCompleteViewingRequest: () => ({ mutate: mockCompleteMutate, isPending: false }),
}));

const mockNoShowMutate = vi.fn();
vi.mock('../hooks/useMarkNoShow', () => ({
  useMarkNoShow: () => ({ mutate: mockNoShowMutate, isPending: false }),
}));

function makeViewingRequest(overrides: Partial<ViewingRequest>): ViewingRequest {
  return {
    id: 'vr1',
    customerId: 'cust1',
    propertyId: 'p1',
    agentId: 'agent1',
    requestedDate: '2026-08-01',
    requestedTime: '14:00',
    status: 'pending',
    notes: null,
    cancellationReason: null,
    createdAt: '2026-07-25T00:00:00.000Z',
    updatedAt: '2026-07-25T00:00:00.000Z',
    property: { id: 'p1', slug: 'test-2br-kilimani', title: 'Test 2BR in Kilimani', images: [] },
    customer: { id: 'cust1', fullName: 'Jane Wanjiru', phone: '0712345678' },
    ...overrides,
  };
}

function renderQueue(viewingRequests: ViewingRequest[]) {
  render(
    <MemoryRouter>
      <AgentBookingQueue viewingRequests={viewingRequests} emptyMessage="No bookings match this filter." />
    </MemoryRouter>,
  );
}

describe('AgentBookingQueue (component)', () => {
  it('shows the empty state message when there are no viewing requests', () => {
    renderQueue([]);
    expect(screen.getByText('No bookings match this filter.')).toBeInTheDocument();
  });

  it('renders the customer name and phone for each booking (BOOK-001)', () => {
    renderQueue([makeViewingRequest({})]);
    expect(screen.getByText('Test 2BR in Kilimani')).toBeInTheDocument();
    expect(screen.getByText(/jane wanjiru/i)).toBeInTheDocument();
    expect(screen.getByText(/0712345678/)).toBeInTheDocument();
  });

  it('confirms a pending viewing request via the actions menu (BOOK-002)', async () => {
    const user = userEvent.setup();
    const viewingRequest = makeViewingRequest({ status: 'pending' });
    renderQueue([viewingRequest]);

    await user.click(screen.getByRole('button', { name: /booking actions/i }));
    await user.click(await screen.findByText('Confirm'));

    expect(mockConfirmMutate).toHaveBeenCalledWith(viewingRequest, expect.anything());
  });

  // BOOK-003/004's actual dialog behavior (submitting a reschedule/cancel
  // and the exact payload passed to the mutation) is covered in isolation by
  // RescheduleBookingDialog.test.tsx / CancelBookingDialog.test.tsx instead of
  // here. Driving the full DropdownMenuItem-select -> Dialog-open transition
  // through a real click in this jsdom version triggers a genuine,
  // reproduced-in-isolation non-terminating recursion between jsdom's
  // `focus()` and `@radix-ui/react-focus-scope` (confirmed via a minimal
  // repro outside this file, independent of `userEvent` vs. `fireEvent`) —
  // an environment limitation, not a real app bug (this exact pattern is
  // already relied on in production and was manually verified in-browser
  // during Sprint 6). These two tests only assert the menu offers the right
  // actions, without completing the transition into the Dialog.
  it('offers Reschedule and Cancel for a pending viewing request (BOOK-003/004)', async () => {
    const user = userEvent.setup();
    renderQueue([makeViewingRequest({ status: 'pending' })]);

    await user.click(screen.getByRole('button', { name: /booking actions/i }));

    expect(await screen.findByText('Reschedule')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('offers Reschedule and Cancel, but not Confirm, for a confirmed viewing request', async () => {
    const user = userEvent.setup();
    renderQueue([makeViewingRequest({ status: 'confirmed' })]);

    await user.click(screen.getByRole('button', { name: /booking actions/i }));

    expect(await screen.findByText('Reschedule')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.queryByText('Confirm')).not.toBeInTheDocument();
  });

  it('marks a confirmed viewing request completed (BOOK-005)', async () => {
    const user = userEvent.setup();
    const viewingRequest = makeViewingRequest({ status: 'confirmed' });
    renderQueue([viewingRequest]);

    await user.click(screen.getByRole('button', { name: /booking actions/i }));
    await user.click(await screen.findByText('Mark completed'));

    expect(mockCompleteMutate).toHaveBeenCalledWith(viewingRequest, expect.anything());
  });

  it('marks a confirmed viewing request as no-show (BOOK-006)', async () => {
    const user = userEvent.setup();
    const viewingRequest = makeViewingRequest({ status: 'confirmed' });
    renderQueue([viewingRequest]);

    await user.click(screen.getByRole('button', { name: /booking actions/i }));
    await user.click(await screen.findByText('Mark no-show'));

    expect(mockNoShowMutate).toHaveBeenCalledWith(viewingRequest, expect.anything());
  });

  it('does not offer confirm/complete/no-show actions for a completed (terminal) viewing request', () => {
    renderQueue([makeViewingRequest({ status: 'completed' })]);

    // A terminal status has no available transitions, so BookingActionsMenu renders nothing.
    expect(screen.queryByRole('button', { name: /booking actions/i })).not.toBeInTheDocument();
  });
});
