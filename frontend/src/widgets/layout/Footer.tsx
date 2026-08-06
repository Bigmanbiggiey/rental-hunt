import { Link } from 'react-router';
import { PATHS } from '@/shared/config';

// CONTENT-002 (2026-08-05) — the first real footer link this project has
// had (FEAT-010's Out of Scope note, since Sprint 1). CONTENT-001 (About)
// had a link here too until 2026-08-05, when that content was merged into
// the homepage and stopped being its own route. Terms of Service and
// Privacy Policy (CONTENT-004) were blocked on real legal text from the
// Product Owner (roadmap.md §14) — built and linked here as of Sprint 10
// (2026-08-06) using boilerplate content, per the developer's own decision
// to customize a template now rather than wait; see TermsPage.tsx's header
// comment for the "review before treating as binding" caveat.
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-surface border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-muted-foreground text-body-sm">© {year} Rental Hunt KE. All rights reserved.</p>
        <nav aria-label="Footer" className="flex gap-6">
          <Link
            to={PATHS.public.terms}
            className="text-muted-foreground text-body-sm hover:text-foreground hover:underline"
          >
            Terms
          </Link>
          <Link
            to={PATHS.public.privacy}
            className="text-muted-foreground text-body-sm hover:text-foreground hover:underline"
          >
            Privacy
          </Link>
          <Link
            to={PATHS.public.contact}
            className="text-muted-foreground text-body-sm hover:text-foreground hover:underline"
          >
            Contact
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export { Footer };
