import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Outlet, useLocation } from 'react-router';
import { RouteErrorBoundary } from '@/shared/ui';
import { Footer } from './Footer';
import { Header } from './Header';
import type { NavLink } from './navLink.types';

interface AppLayoutProps {
  homeHref: string;
  primaryLinks: NavLink[];
}

// A spinner, not a Skeleton — ui-guidelines.md §18 reserves spinners for
// "indeterminate, shape-unknown waits", which is exactly what a still-
// downloading route chunk is (unlike a Skeleton, which mirrors known content).
function RouteLoadingFallback() {
  return (
    <div
      className="flex h-full items-center justify-center p-12"
      role="status"
      aria-label="Loading page"
    >
      <Loader2 className="text-muted-foreground size-8 animate-spin" aria-hidden="true" />
    </div>
  );
}

function AppLayout({ homeHref, primaryLinks }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-full flex-col">
      <Header homeHref={homeHref} primaryLinks={primaryLinks} />
      <main className="flex-1">
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
