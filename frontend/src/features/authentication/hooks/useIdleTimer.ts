import { useCallback, useEffect, useRef, useState } from 'react';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

interface UseIdleTimerOptions {
  /** Total idle time before `onTimeout` fires. */
  idleMs: number;
  /** How long before `idleMs` the warning state turns on. */
  warningMs: number;
  onTimeout: () => void;
  /** When `false`, no timers/listeners run at all — not just paused. */
  enabled: boolean;
}

interface UseIdleTimerResult {
  isWarning: boolean;
  remainingMs: number;
  /** Also called automatically on any tracked activity event. */
  reset: () => void;
}

/**
 * Generic idle-activity tracker — no UI, no auth knowledge. Any of
 * mousemove/keydown/click/scroll/touchstart resets the clock, including
 * while `isWarning` is already true (moving the mouse while reading the
 * warning dialog counts as "still here," same as most real products'
 * session-timeout UX — deliberately not requiring the explicit "stay
 * signed in" click specifically, to avoid a second layer of state).
 *
 * `armTimers` (schedules timeouts, no `setState` of its own) is what the
 * mount effect calls directly — `reset()` additionally clears `isWarning`/
 * `remainingMs` back to their defaults first, which is only ever needed in
 * response to a real activity event or the caller's own "stay signed in"
 * click, never synchronously on mount (the state already starts at those
 * same defaults). Keeps every `setState` call inside an actual callback —
 * an event listener, a timer — rather than directly in the effect body.
 */
export function useIdleTimer({ idleMs, warningMs, onTimeout, enabled }: UseIdleTimerOptions): UseIdleTimerResult {
  const [isWarning, setIsWarning] = useState(false);
  const [remainingMs, setRemainingMs] = useState(warningMs);
  const timers = useRef<{ warn?: number; timeout?: number; countdown?: number }>({});

  const clearTimers = useCallback(() => {
    window.clearTimeout(timers.current.warn);
    window.clearTimeout(timers.current.timeout);
    window.clearInterval(timers.current.countdown);
  }, []);

  const armTimers = useCallback(() => {
    clearTimers();
    if (!enabled) return;

    timers.current.warn = window.setTimeout(() => {
      setIsWarning(true);
      const deadline = Date.now() + warningMs;
      timers.current.countdown = window.setInterval(() => {
        setRemainingMs(Math.max(0, deadline - Date.now()));
      }, 250);
      timers.current.timeout = window.setTimeout(() => {
        clearTimers();
        onTimeout();
      }, warningMs);
    }, Math.max(0, idleMs - warningMs));
  }, [clearTimers, enabled, idleMs, warningMs, onTimeout]);

  const reset = useCallback(() => {
    setIsWarning(false);
    setRemainingMs(warningMs);
    armTimers();
  }, [armTimers, warningMs]);

  useEffect(() => {
    armTimers();
    if (!enabled) return clearTimers;

    const handleActivity = () => reset();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));
    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
    };
  }, [enabled, armTimers, reset, clearTimers]);

  return { isWarning, remainingMs, reset };
}
