import { supabase } from '@/shared/lib/supabase';
import { mapSupabaseError } from '@/shared/lib/errors';
import { mapContactMessageRow, type ContactMessageRow } from './contact-message.mapper';
import type { ContactMessage, ContactMessageFilters, SubmitContactMessageInput } from './contact-message.types';

const CONTACT_MESSAGE_COLUMNS = 'id, user_id, name, email, message, is_resolved, created_at';

// api-design.md §23. Cross-cutting: `features/contact`'s public form submits
// via `submit()`, while `features/admin-messages`' review screen reads
// `list()`/`setResolved()`/`delete()` — two real, independent consumers,
// the ADR-026/028 "2+ consumers" test for living in `entities/` rather than
// either feature's own `repositories/` folder.
export interface ContactMessageRepository {
  /**
   * Deliberately returns `void`, not the created row — database.md §5.16's
   * RLS design has no SELECT policy for anon/customer at all (not even
   * their own submission), and a guest has no `auth.uid()` for a
   * self-scoped policy to key off regardless. `.insert().select().single()`
   * (this repository's usual pattern elsewhere) fails with `42501` for
   * exactly that reason — PostgREST's insert-then-return-representation
   * requires a SELECT the caller doesn't have. Found by a real failing
   * integration test, not assumed from the policy table alone.
   */
  submit(input: SubmitContactMessageInput): Promise<void>;
  /**
   * Backs the Service-layer rate limit (api-design.md §18) — keyed by
   * email, not `user_id`, since a guest submitter has no stable id. Calls
   * the `count_recent_contact_messages_by_email` RPC, not a direct
   * `select(..., { count: 'exact', head: true })` — `anon` has no SELECT
   * grant on this table at all (database.md §9), and PostgREST returns a
   * bare 401 for a head-count request even though it returns no row data.
   * Found via a real failing integration test, not assumed.
   */
  countRecentByEmail(email: string, sinceIso: string): Promise<number>;
  list(filters?: ContactMessageFilters): Promise<ContactMessage[]>;
  setResolved(id: string, isResolved: boolean): Promise<ContactMessage>;
  delete(id: string): Promise<void>;
}

export const contactMessageRepository: ContactMessageRepository = {
  async submit(input) {
    const { error } = await supabase
      .from('contact_messages')
      .insert({ name: input.name, email: input.email, message: input.message });

    if (error) throw mapSupabaseError(error);
  },

  async countRecentByEmail(email, sinceIso) {
    const { data, error } = await supabase.rpc('count_recent_contact_messages_by_email', {
      p_email: email,
      p_since: sinceIso,
    });

    if (error) throw mapSupabaseError(error);
    return data ?? 0;
  },

  // Newest-first, unlike the Verification Queue's oldest-first — a support
  // queue is read by whoever's triaging it, not competed over fairly.
  async list(filters = {}) {
    let query = supabase
      .from('contact_messages')
      .select(CONTACT_MESSAGE_COLUMNS)
      .order('created_at', { ascending: false });

    if (filters.isResolved !== undefined) query = query.eq('is_resolved', filters.isResolved);

    const { data, error } = await query.returns<ContactMessageRow[]>();
    if (error) throw mapSupabaseError(error);
    return (data ?? []).map(mapContactMessageRow);
  },

  async setResolved(id, isResolved) {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ is_resolved: isResolved })
      .eq('id', id)
      .select(CONTACT_MESSAGE_COLUMNS)
      .single<ContactMessageRow>();

    if (error) throw mapSupabaseError(error);
    return mapContactMessageRow(data);
  },

  async delete(id) {
    const { error } = await supabase.from('contact_messages').delete().eq('id', id);
    if (error) throw mapSupabaseError(error);
  },
};
