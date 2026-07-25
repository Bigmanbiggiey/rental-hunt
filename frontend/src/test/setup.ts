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
