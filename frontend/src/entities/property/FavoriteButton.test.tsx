import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { FavoriteButton } from './FavoriteButton';

vi.mock('sonner', () => ({ toast: { info: vi.fn() } }));

describe('FavoriteButton (component)', () => {
  it('renders in its permanent "unsaved" state and shows a coming-soon toast on click, without navigating', async () => {
    const user = userEvent.setup();
    render(<FavoriteButton />);

    const button = screen.getByRole('button', { name: /save property/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    expect(toast.info).toHaveBeenCalledWith('Saving properties is coming soon.');
  });

  it('merges an optional className (for inline detail-page placement) without dropping the base styles', () => {
    render(<FavoriteButton className="static" />);
    const button = screen.getByRole('button', { name: /save property/i });
    expect(button.className).toContain('static');
    expect(button.className).toContain('rounded-full');
  });
});
