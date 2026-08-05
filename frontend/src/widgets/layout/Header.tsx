import { Menu } from 'lucide-react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetTrigger } from '@/shared/ui/sheet';
import { useAuth } from '@/entities/user/context/AuthProvider';
import { useLogout } from '@/features/authentication/hooks/useLogout';
import { PATHS } from '@/shared/config';
import { dashboardPathForRole } from './dashboardPathForRole';
import { MobileNavDrawer } from './MobileNavDrawer';
import type { NavLink } from './navLink.types';

interface HeaderProps {
  homeHref: string;
  primaryLinks: NavLink[];
}

function Header({ homeHref, primaryLinks }: HeaderProps) {
  const { profile, isLoading } = useAuth();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const handleLogout = () => {
    logout(undefined, { onSuccess: () => toast.success('You have been logged out.') });
  };

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
          {!isLoading &&
            (profile ? (
              <>
                <Button asChild variant="ghost">
                  <Link to={dashboardPathForRole(profile.role)}>Go to my dashboard</Link>
                </Button>
                <span className="text-body-sm text-muted-foreground">{profile.fullName}</span>
                <Button variant="outline" onClick={handleLogout} isLoading={isLoggingOut}>
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link to={PATHS.public.login}>Login</Link>
                </Button>
                <Button asChild variant="default">
                  <Link to={PATHS.public.register}>Register</Link>
                </Button>
              </>
            ))}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <MobileNavDrawer primaryLinks={primaryLinks} />
        </Sheet>
      </div>
    </header>
  );
}

export { Header };
