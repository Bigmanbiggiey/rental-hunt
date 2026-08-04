import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { IdleSessionGuard } from './IdleSessionGuard';

const mockUseAuth = vi.fn();
vi.mock('@/entities/user', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockLogoutMutate = vi.fn();
vi.mock('../hooks/useLogout', () => ({
  useLogout: () => ({ mutate: mockLogoutMutate, isPending: false }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  mockLogoutMutate.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('IdleSessionGuard (component, fake timers)', () => {
  it('renders nothing and never signs out a customer, even well past 15 minutes idle', () => {
    mockUseAuth.mockReturnValue({ profile: { role: 'customer' } });
    render(<IdleSessionGuard />);

    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockLogoutMutate).not.toHaveBeenCalled();
  });

  it('renders nothing for a guest (no profile)', () => {
    mockUseAuth.mockReturnValue({ profile: null });
    render(<IdleSessionGuard />);

    act(() => {
      vi.advanceTimersByTime(20 * 60 * 1000);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(mockLogoutMutate).not.toHaveBeenCalled();
  });

  it('warns an admin at 14 minutes idle, then signs out at 15 if ignored', () => {
    mockUseAuth.mockReturnValue({ profile: { role: 'admin' } });
    render(<IdleSessionGuard />);

    act(() => {
      vi.advanceTimersByTime(14 * 60 * 1000);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/you.ve been inactive/i)).toBeInTheDocument();
    expect(mockLogoutMutate).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });
    expect(mockLogoutMutate).toHaveBeenCalledTimes(1);
  });

  it('"Stay signed in" dismisses the warning and resets the clock for a moderator', () => {
    mockUseAuth.mockReturnValue({ profile: { role: 'moderator' } });
    render(<IdleSessionGuard />);

    act(() => {
      vi.advanceTimersByTime(14 * 60 * 1000);
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /stay signed in/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(14 * 60 * 1000);
    });
    expect(mockLogoutMutate).not.toHaveBeenCalled();
  });
});
