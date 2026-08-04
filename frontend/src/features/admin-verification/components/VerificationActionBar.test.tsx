import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { VerificationActionBar } from './VerificationActionBar';

describe('VerificationActionBar (component)', () => {
  it('approves without requiring a reason', () => {
    const onSubmit = vi.fn();
    render(<VerificationActionBar onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /approve/i }));

    expect(onSubmit).toHaveBeenCalledWith({ status: 'verified' });
  });

  it('blocks rejecting with no reason and shows an inline error, without calling onSubmit', () => {
    const onSubmit = vi.fn();
    render(<VerificationActionBar onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /reject/i }));

    expect(screen.getByText(/a reason is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('rejects with a reason once one is entered', () => {
    const onSubmit = vi.fn();
    render(<VerificationActionBar onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/reason/i), {
      target: { value: 'Photos do not match the description.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /reject/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      status: 'rejected',
      reason: 'Photos do not match the description.',
    });
  });
});
