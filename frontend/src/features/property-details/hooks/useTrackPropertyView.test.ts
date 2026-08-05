import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTrackPropertyView } from './useTrackPropertyView';

const mockIncrementView = vi.fn();

vi.mock('../services/property-details.service', () => ({
  propertyDetailsService: { incrementView: (...args: unknown[]) => mockIncrementView(...args) },
}));

beforeEach(() => {
  mockIncrementView.mockReset();
  mockIncrementView.mockResolvedValue(undefined);
  sessionStorage.clear();
});

afterEach(() => {
  sessionStorage.clear();
});

/**
 * AGENT-008. Real regression coverage for the fire-and-forget dedup rule —
 * until this hook existed, incrementViewCount() was never called at all
 * (see the hook's own doc comment), so this is the first test that exists
 * to guard the actual wiring, not just the DB/repository layer underneath it.
 */
describe('useTrackPropertyView (unit)', () => {
  it('does nothing when propertyId is undefined', () => {
    renderHook(() => useTrackPropertyView(undefined));

    expect(mockIncrementView).not.toHaveBeenCalled();
  });

  it('increments once for a new property id', () => {
    renderHook(() => useTrackPropertyView('p1'));

    expect(mockIncrementView).toHaveBeenCalledTimes(1);
    expect(mockIncrementView).toHaveBeenCalledWith('p1');
  });

  it('does not increment again on a rerender with the same id', () => {
    const { rerender } = renderHook(({ id }) => useTrackPropertyView(id), {
      initialProps: { id: 'p1' as string | undefined },
    });
    rerender({ id: 'p1' });
    rerender({ id: 'p1' });

    expect(mockIncrementView).toHaveBeenCalledTimes(1);
  });

  it('increments again for a different property id in the same session', () => {
    const { rerender } = renderHook(({ id }) => useTrackPropertyView(id), {
      initialProps: { id: 'p1' as string | undefined },
    });
    rerender({ id: 'p2' });

    expect(mockIncrementView).toHaveBeenCalledTimes(2);
    expect(mockIncrementView).toHaveBeenNthCalledWith(2, 'p2');
  });

  it('does not increment again for a property already viewed this session (fresh mount)', () => {
    renderHook(() => useTrackPropertyView('p1')).unmount();
    renderHook(() => useTrackPropertyView('p1'));

    expect(mockIncrementView).toHaveBeenCalledTimes(1);
  });

  it('does not throw when the increment call rejects', async () => {
    mockIncrementView.mockRejectedValueOnce(new Error('network error'));

    expect(() => renderHook(() => useTrackPropertyView('p1'))).not.toThrow();
    await vi.waitFor(() => expect(mockIncrementView).toHaveBeenCalledTimes(1));
  });
});
