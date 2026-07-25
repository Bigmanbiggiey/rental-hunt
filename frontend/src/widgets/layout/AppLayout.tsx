import { Outlet } from 'react-router';
import { Footer } from './Footer';
import { Header } from './Header';
import type { NavLink } from './navLink.types';

interface AppLayoutProps {
  homeHref: string;
  primaryLinks: NavLink[];
}

function AppLayout({ homeHref, primaryLinks }: AppLayoutProps) {
  return (
    <div className="flex min-h-full flex-col">
      <Header homeHref={homeHref} primaryLinks={primaryLinks} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export { AppLayout };
