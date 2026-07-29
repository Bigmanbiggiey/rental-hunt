import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FavoriteButton } from './FavoriteButton';

describe('FavoriteButton (component)', () => {
  it('renders the unsaved state and calls onToggle on click, without navigating', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<FavoriteButton isSaved={false} onToggle={onToggle} />);

    const button = screen.getByRole('button', { name: /save property/i });
    expect(button).toHaveAttribute('aria-pressed', 'false');

    await user.click(button);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('renders the saved state with a filled heart and a "remove" label', () => {
    render(<FavoriteButton isSaved onToggle={vi.fn()} />);
    const button = screen.getByRole('button', { name: /remove from favorites/i });
    expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  it('does not call onToggle while pending', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(<FavoriteButton isSaved={false} isPending onToggle={onToggle} />);

    await user.click(screen.getByRole('button', { name: /save property/i }));
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('merges an optional className (for inline detail-page placement) without dropping the base styles', () => {
    render(<FavoriteButton isSaved={false} onToggle={vi.fn()} className="static" />);
    const button = screen.getByRole('button', { name: /save property/i });
    expect(button.className).toContain('static');
    expect(button.className).toContain('rounded-full');
  });
});
