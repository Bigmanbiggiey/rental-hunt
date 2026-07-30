import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// @testing-library/react's auto-cleanup relies on the test framework
// registering a global `afterEach` — vitest.config's `test.globals` is
// deliberately left `false` (coding-standards.md prefers explicit imports
// over injected globals), so cleanup is wired up explicitly here instead.
afterEach(() => {
  cleanup();
});

// jsdom has no ResizeObserver — needed by Radix `Select` (`@radix-ui/react-use-size`)
// and recharts' `ResponsiveContainer`, neither exercised by a test until Sprint 6.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
