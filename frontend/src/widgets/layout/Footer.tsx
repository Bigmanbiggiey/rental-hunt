import { Link } from 'react-router';
import { PATHS } from '@/shared/config';

// CONTENT-001/002 (2026-08-05) — the first real footer links this project
// has had (FEAT-010's Out of Scope note, since Sprint 1). Terms of Service
// and Privacy Policy (CONTENT-004) are deliberately not linked here yet —
// blocked on real legal text from the Product Owner (roadmap.md §13,
// ADR-034's neighbor decision); adding a link to a page with no real content
// would be worse than the current gap.
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-border bg-surface border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-muted-foreground text-body-sm">© {year} Rental Hunt KE. All rights reserved.</p>
        <nav aria-label="Footer" className="flex gap-6">
          <Link
            to={PATHS.public.about}
            className="text-muted-foreground text-body-sm hover:text-foreground hover:underline"
          >
            About
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
