import { useNavigate } from 'react-router';
import { ShieldCheck, Users } from 'lucide-react';
import { SearchInput } from '@/features/property-search';
import { PATHS } from '@/shared/config';

/**
 * FR-HOME-001/FR-HOME-003 — homepage-only, no feature hook, no TanStack
 * Query: the homepage isn't the results page and doesn't need live
 * URL-synced filter state, just a submit-and-navigate search box. Trust
 * indicators are static/qualitative — no aggregate-count endpoint exists in
 * api-design.md, and inventing one now would be unscoped for this sprint.
 */
export function SearchHero() {
  const navigate = useNavigate();

  return (
    <section className="flex flex-col items-center gap-6 bg-accent px-4 py-12 text-center sm:py-16">
      <div className="flex flex-col gap-2">
        <h1 className="text-display font-bold text-foreground">Find your next home in Kenya</h1>
        <p className="text-body text-muted-foreground">
          Verified listings from trusted agencies — search by neighborhood to get started.
        </p>
      </div>

      <div className="flex w-full max-w-xl">
        <SearchInput
          value=""
          size="lg"
          placeholder="Try “Kilimani” or “Nairobi”…"
          onSubmit={(q) => {
            const params = new URLSearchParams();
            if (q) params.set('q', q);
            navigate(`${PATHS.public.properties}?${params.toString()}`);
          }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-body-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Verified Listings
        </span>
        <span className="flex items-center gap-1">
          <Users className="size-4" aria-hidden="true" />
          Trusted Agencies
        </span>
      </div>
    </section>
  );
}
