import { Menu } from 'lucide-react';
import { Link } from 'react-router';
import { Button, Sheet, SheetTrigger } from '@/shared/ui';
import { MobileNavDrawer } from './MobileNavDrawer';
import type { AuthNavLink, NavLink } from './navLink.types';

interface HeaderProps {
  homeHref: string;
  primaryLinks: NavLink[];
  authLinks: AuthNavLink[];
}

// Guest-state nav only (ui-guidelines.md §15.1/§15.2). Role-based states
// (Dashboard link, Favorites/Bookings icon, Avatar menu) arrive with Sprint 2 auth.
function Header({ homeHref, primaryLinks, authLinks }: HeaderProps) {
  return (
    <header className="bg-surface border-border sticky top-0 z-40 border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          to={homeHref}
          className="text-h4 text-foreground focus-visible:ring-ring rounded-md font-semibold focus-visible:ring-2 focus-visible:outline-none"
        >
          Rental Hunt KE
        </Link>

        <nav
          aria-label="Primary"
          className="hidden flex-1 items-center justify-center gap-6 lg:flex"
        >
          {primaryLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-body-sm text-foreground hover:text-primary focus-visible:ring-ring rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {authLinks.map((link) => (
            <Button key={link.to} asChild variant={link.variant}>
              <Link to={link.to}>{link.label}</Link>
            </Button>
          ))}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <MobileNavDrawer primaryLinks={primaryLinks} authLinks={authLinks} />
        </Sheet>
      </div>
    </header>
  );
}

export { Header };
