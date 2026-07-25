import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { profileRepository } from '../profile.repository';
import type { Profile } from '../user.types';

export const AUTH_QUERY_KEY = ['auth', 'currentUser'] as const;

interface AuthContextValue {
  /** `null` for Guests, once loading has settled. */
  profile: Profile | null;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

async function fetchCurrentProfile(): Promise<Profile | null> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return null;
  return profileRepository.getById(data.session.user.id);
}

/**
 * The one sanctioned cross-cutting Context (coding-standards.md §9: "Auth
 * session (current Profile) — genuinely global concerns with few
 * consumers"). Lives in `entities/user`, not `features/authentication`, so
 * every layer that needs "am I logged in / what's my role" can reach it
 * without a sideways features→features import (coding-standards.md §3.2).
 *
 * Deliberately composes `supabase.auth.getSession()` +
 * `profileRepository.getById()` directly rather than calling
 * `authRepository.getCurrentUser()` (api-design.md §5.7, same composition) —
 * `entities/` may only import `shared/`, never `features/authentication`.
 * `onAuthStateChange` is what keeps this in sync after a sign-in/up/out
 * action runs in `features/authentication`, so no upward import is needed.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: profile = null, isLoading } = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: fetchCurrentProfile,
    staleTime: Infinity,
  });

  React.useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => {
      void queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient]);

  const value = React.useMemo(() => ({ profile, isLoading }), [profile, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider.');
  return context;
}
