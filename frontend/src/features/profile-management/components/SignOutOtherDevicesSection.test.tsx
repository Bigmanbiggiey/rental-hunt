import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { actorClient } from '@/shared/lib/testing/rlsTestHelpers';
import { SignOutOtherDevicesSection } from './SignOutOtherDevicesSection';

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <SignOutOtherDevicesSection />
    </QueryClientProvider>,
  );
}

/**
 * Real integration test against the local Supabase stack. The rendered
 * component acts through the app's shared `supabase` singleton ("this
 * device"); a second, independent client signed in as the same user (mirrors
 * `rlsTestHelpers.ts`'s `actorClient()` pattern) stands in for "another
 * device." Proves `scope: 'others'` actually behaves as documented — the
 * other session's refresh token is revoked, this one's isn't — not just that
 * the right arguments were passed.
 */
describe('SignOutOtherDevicesSection (integration, local Supabase)', () => {
  it('revokes another session for the same account while leaving this one signed in', async () => {
    const email = `rtl-sign-out-others-${Date.now()}@example.com`;
    const password = 'Kilimani2026';
    await supabase.auth.signUp({ email, password, options: { data: { full_name: 'Sessions Test' } } });

    const otherDevice = actorClient('sign-out-others');
    const { error: otherSignInError } = await otherDevice.auth.signInWithPassword({ email, password });
    expect(otherSignInError).toBeNull();

    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: /sign out of all other devices/i }));
    await user.click(screen.getByRole('button', { name: /^sign out other devices$/i }));

    // No <Toaster/> is mounted in this render tree (only App.tsx's real one
    // is), so toast text never appears here — the dialog closing (its own
    // onSuccess effect) is the real, in-tree signal the mutation succeeded,
    // mirroring UpdatePasswordForm.test.tsx's own "don't assert toast text"
    // convention.
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), {
      timeout: 10000,
    });

    const { error: otherRefreshError } = await otherDevice.auth.refreshSession();
    expect(otherRefreshError).not.toBeNull();

    const { data: thisDeviceUser, error: thisDeviceError } = await supabase.auth.getUser();
    expect(thisDeviceError).toBeNull();
    expect(thisDeviceUser.user?.email).toBe(email);

    await supabase.auth.signOut();
  }, 15000);
});
