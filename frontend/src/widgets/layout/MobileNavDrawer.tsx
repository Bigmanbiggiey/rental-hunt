import { Link } from 'react-router';
import { Button, SheetClose, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui';
import type { AuthNavLink, NavLink } from './navLink.types';

interface MobileNavDrawerProps {
  primaryLinks: NavLink[];
  authLinks: AuthNavLink[];
}

function MobileNavDrawer({ primaryLinks, authLinks }: MobileNavDrawerProps) {
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
        {authLinks.map((link) => (
          <SheetClose asChild key={link.to}>
            <Button asChild variant={link.variant}>
              <Link to={link.to}>{link.label}</Link>
            </Button>
          </SheetClose>
        ))}
      </div>
    </SheetContent>
  );
}

export { MobileNavDrawer };
