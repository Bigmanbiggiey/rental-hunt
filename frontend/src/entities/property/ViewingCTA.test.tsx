import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ViewingCTA } from './ViewingCTA';

describe('ViewingCTA (component)', () => {
  it('is enabled and calls onBook when the property is available', async () => {
    const user = userEvent.setup();
    const onBook = vi.fn();
    render(<ViewingCTA availabilityStatus="available" onBook={onBook} />);

    const button = screen.getByRole('button', { name: /book a viewing/i });
    expect(button).not.toBeDisabled();
    expect(screen.queryByText(/currently available for booking/i)).not.toBeInTheDocument();

    await user.click(button);
    expect(onBook).toHaveBeenCalledTimes(1);
  });

  it('is disabled with an explanatory alert when the property is unavailable', () => {
    render(<ViewingCTA availabilityStatus="occupied" onBook={vi.fn()} />);
    expect(screen.getByRole('button', { name: /book a viewing/i })).toBeDisabled();
    expect(screen.getByText(/currently available for booking/i)).toBeInTheDocument();
  });
});
