import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Outlet } from 'react-router';
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
    <div className="flex h-full items-center justify-center p-12" role="status" aria-label="Loading page">
      <Loader2 className="size-8 animate-spin text-muted-foreground" aria-hidden="true" />
    </div>
  );
}

function AppLayout({ homeHref, primaryLinks }: AppLayoutProps) {
  return (
    <div className="flex min-h-full flex-col">
      <Header homeHref={homeHref} primaryLinks={primaryLinks} />
      <main className="flex-1">
        <Suspense fallback={<RouteLoadingFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export { AppLayout };
