import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { toHaveNoViolations } from 'jest-axe';

// Sprint 8 (Quality Assurance, roadmap.md §12) — automated WCAG 2.2 AA
// checks via axe-core, extended onto vitest's own `expect` (jest-axe's
// matcher is jest-shaped but vitest's `expect` is API-compatible).
expect.extend(toHaveNoViolations);

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

// jsdom also has no scrollIntoView — cmdk (the shared Combobox's search
// list) calls it internally to keep the highlighted item in view, first
// exercised by a test in the post-Sprint-8 property-form work (2026-08-04).
Element.prototype.scrollIntoView ??= () => {};
