import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { AppError } from '@/shared/lib/errors';
import { RescheduleBookingDialog } from './RescheduleBookingDialog';

/**
 * BOOK-003. Rendered directly with `open` controlled as a prop — not driven
 * through `AgentBookingQueue`'s DropdownMenu, which triggers a genuine
 * jsdom/`@radix-ui/react-focus-scope` recursion when a Dialog opens from a
 * DropdownMenuItem's `onSelect` in this environment (see
 * AgentBookingQueue.test.tsx's note). Mounting an already-open Dialog has no
 * such issue, so this is the real place BOOK-003's submit behavior is proven.
 */
describe('RescheduleBookingDialog (component)', () => {
  it('submits the entered date and time', async () => {
    const onConfirm = vi.fn();
    render(
      <RescheduleBookingDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} />,
    );

    fireEvent.change(screen.getByLabelText(/new date/i), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText(/new time/i), { target: { value: '10:00' } });
    fireEvent.click(screen.getByRole('button', { name: /^reschedule$/i }));

    // react-hook-form's zodResolver validates asynchronously — `onConfirm`
    // isn't called synchronously right after the click.
    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith({ requestedDate: '2026-09-01', requestedTime: '10:00' }),
    );
  });

  it('does not submit when a required field is missing', async () => {
    const onConfirm = vi.fn();
    render(<RescheduleBookingDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: /^reschedule$/i }));

    await waitFor(() => expect(screen.getByText(/choose a date/i)).toBeInTheDocument());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('calls onOpenChange(false) when "Keep current time" is clicked', () => {
    const onOpenChange = vi.fn();
    render(<RescheduleBookingDialog open onOpenChange={onOpenChange} onConfirm={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /keep current time/i }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the submission error message when one is passed', () => {
    render(
      <RescheduleBookingDialog
        open
        onOpenChange={vi.fn()}
        onConfirm={vi.fn()}
        error={new AppError('INVALID_STATE_TRANSITION', 'This booking can no longer be rescheduled.')}
      />,
    );

    expect(screen.getByText('This booking can no longer be rescheduled.')).toBeInTheDocument();
  });
});
