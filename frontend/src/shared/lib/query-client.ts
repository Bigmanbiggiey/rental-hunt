import { QueryClient } from '@tanstack/react-query';

// Default staleTime targets the common case (property-listing-shaped data,
// coding-standards.md §436); individual hooks override per query (e.g.
// `Infinity` for reference data, session-lifetime for the current user).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
    },
  },
});
