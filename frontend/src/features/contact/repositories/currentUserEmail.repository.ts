import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors';

// A near-duplicate of `features/profile-management/repositories/credentials.repository.ts`'s
// `getCurrentEmail()` — not reused directly, since sibling features can't
// cross-import (coding-standards.md §3.2, ADR-025) and this is only the
// second occurrence, not yet the "third real duplicate" ADR-026/028's
// extract-to-entities test looks for.
export const currentUserEmailRepository = {
  async getCurrentEmail(): Promise<string | null> {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw mapSupabaseError(error);
    return data.user?.email ?? null;
  },
};
