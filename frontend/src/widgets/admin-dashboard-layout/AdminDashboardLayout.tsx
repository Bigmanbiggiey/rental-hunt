import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Link, NavLink as RouterNavLink, Outlet, useLocation } from 'react-router';
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
import { useAuth, type UserRole } from '@/entities/user';
import { useLogout } from '@/features/authentication/hooks/useLogout';
import { PATHS } from '@/shared/config';

interface AdminNavLink {
  label: string;
  to: string;
  /** Omitted = visible to every role this layout is mounted for (moderator + admin). */
  roles?: UserRole[];
}

const NAV_LINKS: AdminNavLink[] = [
  { label: 'Overview', to: PATHS.admin.root },
  { label: 'Verification Queue', to: PATHS.admin.verificationQueue },
  { label: 'Users', to: PATHS.admin.users, roles: ['admin'] },
  { label: 'Agencies', to: PATHS.admin.agencies, roles: ['admin'] },
  { label: 'Analytics', to: PATHS.admin.analytics, roles: ['admin'] },
  { label: 'Activity Log', to: PATHS.admin.activityLogs },
];

function initials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function SidebarNav({ role, onNavigate }: { role: UserRole; onNavigate?: () => void }) {
  const links = NAV_LINKS.filter((link) => !link.roles || link.roles.includes(role));

  return (
    <nav aria-label="Admin dashboard" className="flex flex-col gap-1">
      {links.map((link) => (
        <RouterNavLink
          key={link.to}
          to={link.to}
          end={link.to === PATHS.admin.root}
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
 * ui-guidelines.md §7.4/§13.7/§13.8 — mirrors `AgentDashboardLayout`'s shell
 * exactly (256px sidebar >= lg, Sheet drawer < lg, sticky header, User Menu).
 * Unlike that widget, this one only ever renders its own `<Outlet/>` — `/admin`
 * has no shared-URL constraint forcing a `children`-vs-`Outlet` duality (Sprint
 * 6's Gap 3 was specific to `/dashboard` doubling as the generic authenticated
 * landing page; nothing requires `/admin` to do the same), so a single
 * `ProtectedRoute allowedRoles={['moderator','admin']}` + this route-layout
 * element wraps every `/admin/*` page, including the root overview.
 * Nav links are filtered by `profile.role` — a moderator only sees
 * Verification Queue + Activity Log, matching roadmap.md §11's DoD split
 * ("a moderator can review a pending listing" vs. "an admin can deactivate a
 * user, create a new agency"); this is client-side UX only, the real
 * enforcement is RLS (`ProtectedRoute`'s own documented philosophy).
 */
export function AdminDashboardLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { profile } = useAuth();
  const location = useLocation();

  if (!profile) return null;

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
                  <SidebarNav role={profile.role} onNavigate={() => setDrawerOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <Link
              to={PATHS.admin.root}
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
          <SidebarNav role={profile.role} />
        </aside>
        <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8">
          <RouteErrorBoundary key={location.pathname}>
            <Outlet />
          </RouteErrorBoundary>
        </main>
      </div>
    </div>
  );
}
