import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router';
import { RouteErrorBoundary } from '@/shared/ui/route-error-boundary';
import { RouteLoadingFallback } from '@/shared/ui/route-loading-fallback';
import { SkipLink } from '@/shared/ui/skip-link';
import { Footer } from './Footer';
import { Header } from './Header';
import type { NavLink } from './navLink.types';

interface AppLayoutProps {
  homeHref: string;
  primaryLinks: NavLink[];
}

function AppLayout({ homeHref, primaryLinks }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-full flex-col">
      <SkipLink />
      <Header homeHref={homeHref} primaryLinks={primaryLinks} />
      <main id="main-content" className="flex-1">
        <RouteErrorBoundary key={location.pathname}>
          <Suspense fallback={<RouteLoadingFallback />}>
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}

export { AppLayout };
