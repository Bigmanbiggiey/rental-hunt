import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { ShareButton } from './ShareButton';

vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));

// `vi.stubGlobal('navigator', ...)` doesn't reliably override jsdom's own
// `navigator.clipboard` for code paths inside the component (jsdom exposes
// its own Clipboard stub that resolves silently) — defining the properties
// directly on the real `navigator` object is the robust way to control them.
function stubNavigator({ share, writeText }: { share?: (...a: unknown[]) => unknown; writeText?: (...a: unknown[]) => unknown }) {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
}

describe('ShareButton (component)', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses the Web Share API when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    stubNavigator({ share, writeText: vi.fn() });

    const user = userEvent.setup();
    render(<ShareButton title="Test Property" url="https://example.test/p/1" />);
    await user.click(screen.getByRole('button', { name: /share/i }));

    expect(share).toHaveBeenCalledWith({ title: 'Test Property', url: 'https://example.test/p/1' });
  });

  it('silently ignores a cancelled native share sheet (AbortError), never shows an error toast', async () => {
    const abortError = new DOMException('cancelled', 'AbortError');
    const share = vi.fn().mockRejectedValue(abortError);
    stubNavigator({ share, writeText: vi.fn() });

    const user = userEvent.setup();
    render(<ShareButton title="Test Property" url="https://example.test/p/1" />);
    await user.click(screen.getByRole('button', { name: /share/i }));

    expect(toast.success).not.toHaveBeenCalled();
  });

  it('falls back to clipboard + a success toast when the Web Share API is unavailable', async () => {
    // fireEvent, not userEvent, here — userEvent's own internal Clipboard/
    // pointer-event handling interfered with the stubbed `navigator.clipboard`
    // in this jsdom setup (confirmed by direct identity checks while
    // debugging), even though `userEvent.click` works fine in every other
    // test in this suite. `fireEvent.click` synchronously dispatches the DOM
    // event without that layer, and is sufficient for a plain onClick handler.
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubNavigator({ share: undefined, writeText });

    render(<ShareButton title="Test Property" url="https://example.test/p/1" />);
    fireEvent.click(screen.getByRole('button', { name: /share/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalled());
    expect(writeText).toHaveBeenCalledWith('https://example.test/p/1');
  });
});
