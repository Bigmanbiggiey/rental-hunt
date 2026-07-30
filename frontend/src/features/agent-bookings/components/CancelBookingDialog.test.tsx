import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CancelBookingDialog } from './CancelBookingDialog';

/**
 * BOOK-004. Rendered directly with `open` controlled as a prop — see
 * RescheduleBookingDialog.test.tsx's note on why this isn't driven through
 * AgentBookingQueue's DropdownMenu in this jsdom environment.
 */
describe('CancelBookingDialog (component)', () => {
  it('submits the entered reason', () => {
    const onConfirm = vi.fn();
    render(<CancelBookingDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} />);

    fireEvent.change(screen.getByLabelText(/reason/i), {
      target: { value: 'Customer requested cancellation.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /cancel booking/i }));

    expect(onConfirm).toHaveBeenCalledWith('Customer requested cancellation.');
  });

  it('submits undefined when no reason is entered (reason is optional)', () => {
    const onConfirm = vi.fn();
    render(<CancelBookingDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel booking/i }));

    expect(onConfirm).toHaveBeenCalledWith(undefined);
  });

  it('calls onOpenChange(false) when "Keep booking" is clicked', () => {
    const onOpenChange = vi.fn();
    render(<CancelBookingDialog open onOpenChange={onOpenChange} onConfirm={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /keep booking/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
