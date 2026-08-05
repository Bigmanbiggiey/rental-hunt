import { useState, type ReactNode } from 'react';
import { ExternalLink, Menu } from 'lucide-react';
import { Link, NavLink as RouterNavLink, useLocation } from 'react-router';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { RouteErrorBoundary } from '@/shared/ui/route-error-boundary';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/shared/ui/sheet';
import { SkipLink } from '@/shared/ui/skip-link';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/entities/user';
import { useLogout } from '@/features/authentication/hooks/useLogout';
import { PATHS } from '@/shared/config';

export interface DashboardNavLink {
  label: string;
  to: string;
  /** Defaults to an exact-match highlight only for the shell's own root path. */
  end?: boolean;
}

interface DashboardShellProps {
  /** Where the "Rental Hunt KE" brand link and mobile drawer title point — this role's dashboard root. */
  brandHref: string;
  /** `aria-label` for the nav landmark, e.g. "Admin dashboard". */
  navLabel: string;
  navLinks: DashboardNavLink[];
  /**
   * Optional line under the brand link — added 2026-08-05 for the agent
   * dashboard's own agency name (no other role has an equivalent concept),
   * so this stays a plain optional prop the other three roles simply don't
   * pass, rather than a role-specific branch inside this shared shell.
   */
  subtitle?: string;
  children: ReactNode;
}

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function SidebarNav({
  navLabel,
  navLinks,
  onNavigate,
}: {
  navLabel: string;
  navLinks: DashboardNavLink[];
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label={navLabel} className="flex flex-col gap-1">
      {navLinks.map((link) => (
        <RouterNavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'text-body-sm rounded-md px-3 py-2 font-medium transition-colors',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
            )
          }
        >
          {link.label}
        </RouterNavLink>
      ))}
    </nav>
  );
}

// A way back to the public site, present in every dashboard's sidebar —
// found missing 2026-08-04, right after the four-dashboard restructuring
// removed the last incidental way to get there (the old shared shells at
// least kept AppLayout's own Header, which had a home link; the new
// self-contained shells don't render it at all).
function ViewSiteLink({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="border-border mt-2 border-t pt-2">
      <Link
        to={PATHS.public.home}
        onClick={onNavigate}
        className="text-body-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-3 py-2 font-medium transition-colors"
      >
        <ExternalLink className="size-4" aria-hidden="true" />
        View site
      </Link>
    </div>
  );
}

function SidebarContent({
  navLabel,
  navLinks,
  onNavigate,
}: {
  navLabel: string;
  navLinks: DashboardNavLink[];
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col">
      <SidebarNav navLabel={navLabel} navLinks={navLinks} onNavigate={onNavigate} />
      <ViewSiteLink onNavigate={onNavigate} />
    </div>
  );
}

function UserMenu() {
  const { profile } = useAuth();
  const { mutate: logout, isPending } = useLogout();

  if (!profile) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto rounded-full p-0" aria-label="Account menu">
          <Avatar>
            <AvatarFallback>{initials(profile.fullName)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{profile.fullName}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={PATHS.authenticated.profile}>Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isPending}
          onSelect={() =>
            logout(undefined, { onSuccess: () => toast.success('You have been logged out.') })
          }
        >
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * ui-guidelines.md §7.4/§13.7/§13.8 — the one dashboard shell shape (256px
 * sidebar >= lg, Sheet drawer < lg, sticky header, User Menu), shared by all
 * four role dashboards instead of four near-identical copies. Each role's
 * own layout widget (`admin-dashboard-layout`, `moderator-dashboard-layout`,
 * `agent-dashboard-layout`, `user-dashboard-layout`) just supplies its own
 * `navLinks`/`brandHref`/`navLabel` and renders `<Outlet/>` as `children`.
 *
 * Deliberately self-contained — no `AppLayout` wrapping (post-Sprint-8
 * restructuring, 2026-08-04): every dashboard route group is now a sibling
 * of `AppLayout` in `routes.tsx`, not nested under it, so the public site's
 * `Header`/`Footer` never render alongside this shell. That's what actually
 * fixes the double-navbar bug this restructuring was partly driven by —
 * previously every dashboard route rendered both this shell's own header
 * *and* `AppLayout`'s public one at the same time.
 */
export function DashboardShell({ brandHref, navLabel, navLinks, subtitle, children }: DashboardShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex min-h-full flex-col">
      <SkipLink />
      <header className="bg-surface border-border sticky top-0 z-40 border-b">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                  <Menu aria-hidden="true" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <SheetHeader>
                  <SheetTitle>Rental Hunt KE</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <SidebarContent
                    navLabel={navLabel}
                    navLinks={navLinks}
                    onNavigate={() => setDrawerOpen(false)}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <div className="flex flex-col leading-tight">
              <Link
                to={brandHref}
                className="text-h4 text-foreground focus-visible:ring-ring rounded-md font-semibold focus-visible:ring-2 focus-visible:outline-none"
              >
                Rental Hunt KE
              </Link>
              {subtitle && <span className="text-body-sm text-muted-foreground">{subtitle}</span>}
            </div>
          </div>

          <UserMenu />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="border-border hidden w-64 shrink-0 border-r p-4 lg:block">
          <SidebarContent navLabel={navLabel} navLinks={navLinks} />
        </aside>
        {/*
          `min-w-0` is load-bearing, not decorative (found 2026-08-05, real-device
          mobile pass across all four roles): `main` is a flex item in this row
          (aside + main), and a flex item's default `min-width: auto` refuses to
          shrink below its content's own unbroken min-content width. At >= lg this
          never mattered (plenty of horizontal room), but at mobile widths any page
          whose content is wide enough — a booking card row, a data table, the
          property gallery — forced the whole page to scroll horizontally instead
          of the content wrapping/scrolling internally as each of those already
          does correctly on its own (e.g. `shared/ui/table.tsx`'s own `overflow-auto`
          wrapper). Confirmed via live testing: 57px overflow on the Customer
          welcome block, 215px on the admin Contact Messages table, 325px on the
          Verification Review gallery — all three resolved by this one class.
          `AppLayout`'s own `<main>` never had this bug: it sits in a column flex,
          not a row, so cross-axis stretch sets its width directly rather than
          going through this same content-based minimum-size calculation.
        */}
        <main id="main-content" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <RouteErrorBoundary key={location.pathname}>{children}</RouteErrorBoundary>
        </main>
      </div>
    </div>
  );
}
