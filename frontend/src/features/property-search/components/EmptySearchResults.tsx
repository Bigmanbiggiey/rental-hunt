import { SearchX } from 'lucide-react';
import { EmptyState } from '@/shared/ui';

/** DISC-006 — anatomy per `ui-guidelines.md` §19's "No search results" row. */
export function EmptySearchResults({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <EmptyState
      icon={SearchX}
      heading="No properties match your search"
      description="Try adjusting your filters or searching a different area."
      action={{ label: 'Clear filters', onClick: onClearFilters }}
    />
  );
}
