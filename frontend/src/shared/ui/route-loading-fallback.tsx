import { Loader2 } from 'lucide-react';

// A spinner, not a Skeleton — ui-guidelines.md §18 reserves spinners for
// "indeterminate, shape-unknown waits", which is exactly what a still-
// downloading route chunk is (unlike a Skeleton, which mirrors known
// content). Shared by every top-level layout's own <Suspense> boundary
// (AppLayout, and each of the four dashboard shells) since Sprint 8's
// bundle-splitting means route chunks — including the dashboard layouts
// themselves — load lazily.
export function RouteLoadingFallback() {
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
