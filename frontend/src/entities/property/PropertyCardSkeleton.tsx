import { Skeleton } from '@/shared/ui';

// Matches PropertyCard's exact shape (ui-guidelines.md §11.18) so the grid
// doesn't jump when real cards replace these while `useProperties` loads.
export function PropertyCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
        </div>
      </div>
    </div>
  );
}
