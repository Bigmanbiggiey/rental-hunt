import { useEffect } from 'react';
import { propertyDetailsService } from '../services/property-details.service';

const SESSION_KEY_PREFIX = 'viewed-property:';

/**
 * AGENT-008. Wires up `propertyRepository.incrementViewCount()` — until
 * 2026-08-05 this was genuinely dead code: the DB column, RPC, and
 * repository method all existed and were tested, but nothing in the app
 * ever called it, so `view_count` never moved regardless of real traffic
 * (found while investigating how view counting worked at all).
 *
 * A view is counted the first time a given browser tab loads a specific
 * property's detail page in a session — not on card hover/click from a
 * list, not per re-render. `sessionStorage` dedup (one increment per
 * property per tab) is the fire-and-forget method's own doc comment's
 * reasoning made concrete: without it, a TanStack Query refetch/refocus on
 * an already-open page would double-count. A real network call + storage
 * write, so it belongs in an effect, not render — fails silently, since a
 * view-count miss isn't worth surfacing to the visitor.
 */
export function useTrackPropertyView(propertyId: string | undefined): void {
  useEffect(() => {
    if (!propertyId) return;

    const sessionKey = SESSION_KEY_PREFIX + propertyId;
    if (sessionStorage.getItem(sessionKey)) return;

    sessionStorage.setItem(sessionKey, '1');
    void propertyDetailsService.incrementView(propertyId).catch(() => {});
  }, [propertyId]);
}
