import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { AuthProvider } from '@/entities/user';
import { supabase } from '@/shared/lib/supabase';
import { FavoritesPage } from './FavoritesPage';

/** Real integration test against the local Supabase stack — mirrors ProtectedRoute.test.tsx's AuthProvider-wrapped pattern. FAV-002/FAV-003. */
function renderFavoritesPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/favorites']}>
          <FavoritesPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('FavoritesPage (integration, local Supabase)', () => {
  it('shows an empty state for a customer with no saved properties', async () => {
    const email = `rtl-favorites-empty-${Date.now()}@example.com`;
    await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Favorites Empty Test' } },
    });

    renderFavoritesPage();

    expect(
      await screen.findByText(/no saved properties yet/i, {}, { timeout: 10000 }),
    ).toBeInTheDocument();

    await supabase.auth.signOut();
  });

  it('lists a saved property and removing it updates the list without a page reload', async () => {
    const email = `rtl-favorites-list-${Date.now()}@example.com`;
    const { data: signUpData } = await supabase.auth.signUp({
      email,
      password: 'Kilimani2026',
      options: { data: { full_name: 'Favorites List Test' } },
    });

    const { data: property } = await supabase
      .from('properties')
      .select('id')
      .eq('slug', '2br-apartment-kilimani-a1')
      .single();
    const { error: favoriteError } = await supabase
      .from('favorites')
      .upsert(
        { customer_id: signUpData.user!.id, property_id: property!.id },
        { onConflict: 'customer_id,property_id', ignoreDuplicates: true },
      );
    expect(favoriteError).toBeNull();

    const user = userEvent.setup();
    renderFavoritesPage();

    expect(
      await screen.findByText(/modern 2br apartment in kilimani/i, {}, { timeout: 10000 }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove from favorites/i }));

    await waitFor(() => expect(screen.getByText(/no saved properties yet/i)).toBeInTheDocument(), {
      timeout: 10000,
    });

    await supabase.auth.signOut();
  }, 15000);
});
