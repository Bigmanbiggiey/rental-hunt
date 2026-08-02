import { Link } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/shared/ui/button';
import { SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { useAuth } from '@/entities/user/context/AuthProvider';
import { useLogout } from '@/features/authentication/hooks/useLogout';
import { PATHS } from '@/shared/config';
import type { NavLink } from './navLink.types';

interface MobileNavDrawerProps {
  primaryLinks: NavLink[];
}

function MobileNavDrawer({ primaryLinks }: MobileNavDrawerProps) {
  const { profile, isLoading } = useAuth();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const handleLogout = () => {
    logout(undefined, { onSuccess: () => toast.success('You have been logged out.') });
  };

  return (
    <SheetContent side="left" className="flex flex-col gap-6">
      <SheetHeader>
        <SheetTitle>Menu</SheetTitle>
      </SheetHeader>

      <nav aria-label="Primary" className="flex flex-col gap-1">
        {primaryLinks.map((link) => (
          <SheetClose asChild key={link.to}>
            <Link
              to={link.to}
              className="text-body text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring rounded-md px-3 py-2 font-medium focus-visible:ring-2 focus-visible:outline-none"
            >
              {link.label}
            </Link>
          </SheetClose>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        {!isLoading &&
          (profile ? (
            <>
              <p className="text-body-sm text-muted-foreground px-3">{profile.fullName}</p>
              <SheetClose asChild>
                <Button variant="outline" onClick={handleLogout} isLoading={isLoggingOut}>
                  Log out
                </Button>
              </SheetClose>
            </>
          ) : (
            <>
              <SheetClose asChild>
                <Button asChild variant="outline">
                  <Link to={PATHS.public.login}>Login</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button asChild variant="default">
                  <Link to={PATHS.public.register}>Register</Link>
                </Button>
              </SheetClose>
            </>
          ))}
      </div>
    </SheetContent>
  );
}

export { MobileNavDrawer };
