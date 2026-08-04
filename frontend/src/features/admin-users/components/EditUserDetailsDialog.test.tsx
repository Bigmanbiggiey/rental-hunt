import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Profile } from '@/entities/user';
import { EditUserDetailsDialog } from './EditUserDetailsDialog';

const mockMutate = vi.fn();
vi.mock('../hooks/useAdminUpdateUser', () => ({
  useAdminUpdateUser: () => ({ mutate: mockMutate, isPending: false, error: null, reset: vi.fn() }),
}));

const USER: Profile = {
  id: 'u1',
  role: 'customer',
  fullName: 'James Mwangi',
  phone: '+254712345678',
  avatarUrl: null,
  notificationPreferences: {},
  isActive: true,
  createdAt: '2026-07-20T00:00:00.000Z',
};

describe('EditUserDetailsDialog (component)', () => {
  it('renders without crashing and pre-fills the current name/phone', () => {
    // Regression test for a real bug (2026-08-04): the form's resolver
    // schema was originally AdminUpdateUserSchema.pick(...), which Zod
    // throws on *at runtime* for a schema built with .refine() — invisible
    // to typecheck, only caught by actually rendering this component, which
    // no test did before this file. Simply mounting the dialog is the
    // meaningful assertion here.
    render(<EditUserDetailsDialog open onOpenChange={vi.fn()} user={USER} />);

    expect(screen.getByLabelText(/full name/i)).toHaveValue('James Mwangi');
    expect(screen.getByLabelText(/phone/i)).toHaveValue('+254712345678');
  });

  it('submits the edited name/phone', async () => {
    const user = userEvent.setup();
    render(<EditUserDetailsDialog open onOpenChange={vi.fn()} user={USER} />);

    const nameInput = screen.getByLabelText(/full name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'James M. Mwangi');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      { id: 'u1', input: { fullName: 'James M. Mwangi', phone: '+254712345678' } },
      expect.anything(),
    );
  });
});
