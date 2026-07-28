import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ViewingCTA } from './ViewingCTA';

describe('ViewingCTA (component)', () => {
  it('renders "Book a Viewing" always disabled, with a coming-soon explanation', () => {
    render(<ViewingCTA />);
    expect(screen.getByRole('button', { name: /book a viewing/i })).toBeDisabled();
    expect(screen.getByText(/booking is coming soon/i)).toBeInTheDocument();
  });
});
