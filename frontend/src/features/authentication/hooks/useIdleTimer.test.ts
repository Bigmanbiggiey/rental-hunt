import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useIdleTimer } from './useIdleTimer';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useIdleTimer (unit, fake timers)', () => {
  it('runs no timers and never warns/times out when disabled', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimer({ idleMs: 1000, warningMs: 200, onTimeout, enabled: false }),
    );

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(result.current.isWarning).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('warns at idleMs - warningMs, then calls onTimeout once the warning window elapses', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimer({ idleMs: 1000, warningMs: 200, onTimeout, enabled: true }),
    );

    act(() => {
      vi.advanceTimersByTime(799);
    });
    expect(result.current.isWarning).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.isWarning).toBe(true);
    expect(onTimeout).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(onTimeout).toHaveBeenCalledTimes(1);
  });

  it('calling reset() before the warning threshold prevents it from firing on schedule', () => {
    const onTimeout = vi.fn();
    const { result } = renderHook(() =>
      useIdleTimer({ idleMs: 1000, warningMs: 200, onTimeout, enabled: true }),
    );

    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      result.current.reset();
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });

    // 700ms after the reset is still short of the 800ms warning threshold.
    expect(result.current.isWarning).toBe(false);
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('a real tracked activity event (keydown) resets the timer the same way reset() does', () => {
    const onTimeout = vi.fn();
    renderHook(() => useIdleTimer({ idleMs: 1000, warningMs: 200, onTimeout, enabled: true }));

    act(() => {
      vi.advanceTimersByTime(700);
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown'));
    });
    act(() => {
      vi.advanceTimersByTime(700);
    });

    expect(onTimeout).not.toHaveBeenCalled();
  });
});
