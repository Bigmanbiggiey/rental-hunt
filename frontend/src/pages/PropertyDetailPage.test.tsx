import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { PropertyDetailPage } from './PropertyDetailPage';

/** Real integration test against the local Supabase stack — mirrors `PropertiesPage.test.tsx`'s pattern. */
function renderDetailPage(slug: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/properties/${slug}`]}>
        <Routes>
          <Route path="/properties/:slug" element={<PropertyDetailPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PropertyDetailPage (integration, local Supabase)', () => {
  it('renders every field for a real seeded property — gallery, price, amenities (present + absent), agent, map, verification', async () => {
    renderDetailPage('2br-apartment-kilimani-a1');

    await waitFor(
      () => expect(screen.getByRole('heading', { name: /modern 2br apartment in kilimani/i })).toBeInTheDocument(),
      { timeout: 10000 },
    );

    expect(screen.getByText(/rent: kes 55,000\/mo/i)).toBeInTheDocument();
    expect(screen.getByText(/deposit: kes 55,000/i)).toBeInTheDocument();
    expect(screen.getByText(/kilimani, nairobi/i)).toBeInTheDocument();

    // Amenities: present (seeded blanket Parking/WiFi/Security) and absent both render.
    expect(screen.getByText('Parking')).toBeInTheDocument();
    expect(screen.getByText('Swimming Pool')).toBeInTheDocument();

    // Agent card.
    expect(screen.getByText('James Mwangi')).toBeInTheDocument();

    // Verification + last-verified date.
    expect(screen.getByText('Verified')).toBeInTheDocument();
    expect(screen.getByText(/last verified/i)).toBeInTheDocument();

    // Viewing CTA, disabled.
    expect(screen.getByRole('button', { name: /book a viewing/i })).toBeDisabled();

    // Map "Get Directions" link with the correct coordinates.
    const directionsLink = screen.getByRole('link', { name: /get directions/i });
    expect(directionsLink).toHaveAttribute('href', expect.stringContaining('destination=-1.29,36.783'));

    // Related properties (same county/type as the fixture — see property.rls.test.ts).
    await waitFor(() => expect(screen.getByText('Similar Properties')).toBeInTheDocument());
  });

  it('shows a clear not-found message for a rejected/invisible slug, not the generic error', async () => {
    renderDetailPage('apartment-south-c-a8');

    expect(
      await screen.findByText(/could not be found/i, {}, { timeout: 10000 }),
    ).toBeInTheDocument();
  });
});
