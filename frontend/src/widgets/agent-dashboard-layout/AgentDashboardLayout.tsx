import { useState, type ReactNode } from 'react';
import { Menu } from 'lucide-react';
import { Link, NavLink as RouterNavLink, Outlet } from 'react-router';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { useAuth } from '@/entities/user';
import { useLogout } from '@/features/authentication';
import { PATHS } from '@/shared/config';

const NAV_LINKS = [
  { label: 'Overview', to: PATHS.authenticated.dashboard },
  { label: 'Properties', to: PATHS.authenticated.agentProperties },
  { label: 'Bookings', to: PATHS.authenticated.agentBookings },
  { label: 'Analytics', to: PATHS.authenticated.agentAnalytics },
];

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Agent dashboard" className="flex flex-col gap-1">
      {NAV_LINKS.map((link) => (
        <RouterNavLink
          key={link.to}
          to={link.to}
          end={link.to === PATHS.authenticated.dashboard}
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

// ui-guidelines.md §13.9: a Dropdown Menu triggered by the Avatar, showing
// name, a link to Profile, and Logout. No separate "Notification
// Preferences" link — that form lives on ProfilePage itself, there's no
// dedicated route for it.
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
 * ui-guidelines.md §7.4/§13.7/§13.8. A self-contained shell (own top nav +
 * sidebar), not `AppLayout` + a bolted-on sidebar — the public `Header`'s
 * shape (Browse Properties link, guest Login/Register) doesn't match
 * §13.8's dashboard top-nav spec (logo, page context, User Menu only).
 * Sidebar is 256px (`w-64`, §7.3) on >= lg; on < lg it collapses into a
 * Sheet drawer triggered by the hamburger (§7.3's off-canvas spec), mirroring
 * `widgets/layout/Header.tsx` + `MobileNavDrawer.tsx`'s existing pattern.
 *
 * Takes `children` rather than always rendering its own `<Outlet/>` — the
 * Sprint 6 plan (Gap 3) keeps `/dashboard` itself inside the *generic*
 * authenticated route group (not this widget's own agent-only route group),
 * branching role at the `DashboardPage` component level. So
 * `AgentDashboardOverviewPage` self-wraps with this shell directly
 * (passing its own content as `children`), while the four sibling pages
 * reached through the dedicated agent-only route group get the shell from
 * `AgentDashboardLayoutRoute` below instead — never both at once.
 */
export function AgentDashboardLayout({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col">
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
                  <SidebarNav onNavigate={() => setDrawerOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <Link
              to={PATHS.authenticated.dashboard}
              className="text-h4 text-foreground focus-visible:ring-ring rounded-md font-semibold focus-visible:ring-2 focus-visible:outline-none"
            >
              Rental Hunt KE
            </Link>
          </div>

          <UserMenu />
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="border-border hidden w-64 shrink-0 border-r p-4 lg:block">
          <SidebarNav />
        </aside>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

/** The route-layout variant, used by `routes.tsx` for the four agent-only `/dashboard/*` paths — supplies `<Outlet/>` as `AgentDashboardLayout`'s children. */
export function AgentDashboardLayoutRoute() {
  return (
    <AgentDashboardLayout>
      <Outlet />
    </AgentDashboardLayout>
  );
}
