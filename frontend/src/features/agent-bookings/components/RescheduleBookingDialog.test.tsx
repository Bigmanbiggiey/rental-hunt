import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<RescheduleBookingDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} />);

    // DatePicker (2026-08-05): open the popover, advance a month so every day
    // shown is guaranteed enabled (today and earlier are disabled), pick the
    // 15th — unambiguous within a single visible month.
    await user.click(screen.getByLabelText(/new date/i));
    await user.click(screen.getByRole('button', { name: /go to the next month/i }));
    await user.click(screen.getByRole('button', { name: /15/ }));

    // TimePicker (2026-08-05): three Selects (Hour/Minute/AM-PM). Driven by
    // keyboard, each key press individually awaited — Radix Select moves
    // focus between options via an internal `setTimeout`, so a single
    // chained `user.keyboard('{ArrowDown}{ArrowDown}...')` call can outrun
    // it and select the wrong (or no) item; awaiting each press lets it
    // settle first. Hour list starts auto-focused on "1", so one ArrowDown
    // reaches "2"; Minute list opens auto-focused on its first item ("00"),
    // so Enter alone selects it. AM/PM is left at its default (AM).
    await user.click(screen.getByLabelText(/new time/i));
    await user.keyboard('{ArrowDown}');
    await user.keyboard('{Enter}');
    const comboboxes = screen.getAllByRole('combobox');
    await user.click(comboboxes[1]!);
    await user.keyboard('{Enter}');

    await user.click(screen.getByRole('button', { name: /^reschedule$/i }));

    // react-hook-form's zodResolver validates asynchronously — `onConfirm`
    // isn't called synchronously right after the click. The exact date
    // submitted depends on "next month, the 15th" relative to whenever the
    // test runs, so assert the time and the date's shape rather than a
    // hardcoded date string.
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1));
    const [submitted] = onConfirm.mock.calls[0]!;
    expect(submitted.requestedTime).toBe('02:00');
    expect(submitted.requestedDate).toMatch(/^\d{4}-\d{2}-15$/);
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
