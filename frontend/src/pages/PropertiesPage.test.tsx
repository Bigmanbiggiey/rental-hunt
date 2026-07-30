import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { createClient } from '@supabase/supabase-js';
import { AuthProvider } from '@/entities/user';
import { PropertiesPage } from './PropertiesPage';

/**
 * Real integration test against the local Supabase stack (mirrors
 * `LoginForm.test.tsx`'s pattern) — proves cursor pagination is actually
 * correct through the real rendered page, not just the repository in
 * isolation. `supabase/seed.sql` only ships 7 properties (not enough to
 * exceed the default page size of 20), so this test inserts 15 additional
 * synthetic rows via a service-role client to force a real "Load more" page
 * boundary, then removes them in `afterAll` — leaving `seed.sql`'s own
 * fixture data untouched for every other test file.
 */
const SUPABASE_URL = 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const EXTRA_SLUG_PREFIX = 'pagination-test-fixture-';
let insertedIds: string[] = [];

function renderPropertiesPage(initialUrl = '/properties') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialUrl]}>
          <PropertiesPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

beforeAll(async () => {
  const { data: agency } = await serviceClient.from('agencies').select('id').limit(1).single();
  const { data: agent } = await serviceClient.from('agents').select('id').limit(1).single();
  const { data: propertyType } = await serviceClient
    .from('property_types')
    .select('id')
    .limit(1)
    .single();
  const { data: county } = await serviceClient.from('counties').select('id').limit(1).single();
  const { data: location } = await serviceClient
    .from('locations')
    .select('id')
    .eq('county_id', county!.id)
    .limit(1)
    .single();

  const rows = Array.from({ length: 15 }, (_, i) => ({
    agency_id: agency!.id,
    agent_id: agent!.id,
    property_type_id: propertyType!.id,
    county_id: county!.id,
    location_id: location!.id,
    title: `Pagination Fixture ${i}`,
    slug: `${EXTRA_SLUG_PREFIX}${i}`,
    description: 'Synthetic fixture for cursor-pagination testing.',
    latitude: -1.3,
    longitude: 36.8,
    bedrooms: 1,
    bathrooms: 1,
    rent_amount: 10000 + i,
    deposit_amount: 10000,
    verification_status: 'verified',
  }));

  const { data, error } = await serviceClient.from('properties').insert(rows).select('id');
  if (error) throw error;
  insertedIds = (data ?? []).map((r: { id: string }) => r.id);
}, 30000);

afterAll(async () => {
  if (insertedIds.length > 0) {
    await serviceClient.from('properties').delete().in('id', insertedIds);
  }
});

describe('PropertiesPage (integration, local Supabase) — cursor pagination', () => {
  it('renders the first page (20 properties) and loads the rest with no duplicates on "Load more"', async () => {
    renderPropertiesPage();

    await waitFor(
      () => {
        const links = screen
          .getAllByRole('link')
          .filter((el) => el.getAttribute('href')?.includes('/properties/'));
        expect(links.length).toBe(20);
      },
      { timeout: 10000 },
    );

    const loadMore = await screen.findByRole('button', { name: /load more/i });

    const user = userEvent.setup();
    await user.click(loadMore);

    await waitFor(
      () => {
        const links = screen
          .getAllByRole('link')
          .filter((el) => el.getAttribute('href')?.includes('/properties/'));
        const hrefs = links.map((el) => el.getAttribute('href'));
        // >= 22 (7 seeded + 15 synthetic), not === — a concurrently-running
        // RLS test elsewhere in the suite may create its own guest-visible
        // property fixture at the same moment (a real, documented,
        // pre-existing cross-file timing gap against this shared, mutable
        // table — see project-state.md's Technical Debt). What this
        // assertion actually needs to prove is that cursor pagination
        // doesn't drop or duplicate results, not that it can pin an exact
        // global count on a table other tests can concurrently write to.
        expect(links.length).toBeGreaterThanOrEqual(22);
        expect(new Set(hrefs).size).toBe(hrefs.length);
        for (let i = 0; i < 15; i++) {
          expect(hrefs.some((href) => href?.includes(`${EXTRA_SLUG_PREFIX}${i}`))).toBe(true);
        }
      },
      { timeout: 10000 },
    );

    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
  });

  it('applies a filter from the URL and shows only matching results', async () => {
    renderPropertiesPage('/properties?maxPrice=10005');

    await waitFor(
      () => {
        expect(screen.getByText(/pagination fixture 0/i)).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // None of the real 55k+ seeded properties should be present under this price ceiling.
    expect(screen.queryByText(/modern 2br apartment in kilimani/i)).not.toBeInTheDocument();
  });

  it('shows the empty state and recovers the full list on "Clear filters"', async () => {
    renderPropertiesPage('/properties?bedroomsMin=99');

    expect(await screen.findByText(/no properties match your search/i)).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /clear filters/i }));

    await waitFor(() => {
      expect(screen.queryByText(/no properties match your search/i)).not.toBeInTheDocument();
    });
  });
});
