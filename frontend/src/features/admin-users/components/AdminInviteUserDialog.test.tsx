import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppError } from '@/shared/lib/errors';
import { AdminInviteUserDialog } from './AdminInviteUserDialog';

const mockMutate = vi.fn();
let mockError: unknown = null;
vi.mock('../hooks/useInviteUser', () => ({
  useInviteUser: () => ({ mutate: mockMutate, isPending: false, error: mockError, reset: vi.fn() }),
}));

describe('AdminInviteUserDialog (component)', () => {
  it('shows validation errors and never calls the mutation for an incomplete form', async () => {
    const user = userEvent.setup();
    render(<AdminInviteUserDialog open onOpenChange={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /send invite/i }));

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument();
    expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('submits a well-formed invite with the selected role', async () => {
    const user = userEvent.setup();
    render(<AdminInviteUserDialog open onOpenChange={vi.fn()} />);

    await user.type(screen.getByLabelText(/email/i), 'agent2@example.com');
    await user.type(screen.getByLabelText(/full name/i), 'James Mwangi');
    await user.click(screen.getByRole('button', { name: /send invite/i }));

    expect(mockMutate).toHaveBeenCalledWith(
      { email: 'agent2@example.com', fullName: 'James Mwangi', role: 'customer' },
      expect.anything(),
    );
  });

  it('shows the submission error from a failed invite', () => {
    mockError = new AppError('EMAIL_ALREADY_REGISTERED', 'A user with this email already exists.');
    render(<AdminInviteUserDialog open onOpenChange={vi.fn()} />);

    expect(screen.getByText('A user with this email already exists.')).toBeInTheDocument();
    mockError = null;
  });
});
