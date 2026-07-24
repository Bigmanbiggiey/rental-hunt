import { Outlet } from 'react-router';
import { Footer } from './Footer';
import { Header } from './Header';
import type { AuthNavLink, NavLink } from './navLink.types';

interface AppLayoutProps {
  homeHref: string;
  primaryLinks: NavLink[];
  authLinks: AuthNavLink[];
}

function AppLayout({ homeHref, primaryLinks, authLinks }: AppLayoutProps) {
  return (
    <div className="flex min-h-full flex-col">
      <Header homeHref={homeHref} primaryLinks={primaryLinks} authLinks={authLinks} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export { AppLayout };
