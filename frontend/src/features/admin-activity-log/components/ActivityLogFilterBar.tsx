import { Input, Label } from '@/shared/ui';
import type { ActivityLogFilters as Filters } from '../repositories/activity-log.repository';

export interface ActivityLogFilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const ENTITY_TYPES = ['property', 'viewing_request', 'profile'];

/**
 * Named `...FilterBar`, not `...Filters` — the repository's own
 * `ActivityLogFilters` type (the filter *values* shape) already claims that
 * name in this feature's barrel; `FilterBar` matches
 * `features/property-search/components/FilterBar.tsx`'s existing naming
 * precedent for "the component that edits a filters object."
 */
export function ActivityLogFilterBar({ filters, onChange }: ActivityLogFilterBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1">
        <Label htmlFor="activity-log-entity-type">Entity type</Label>
        <select
          id="activity-log-entity-type"
          className="border-input h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm sm:w-48 md:text-sm"
          value={filters.entityType ?? ''}
          onChange={(event) => onChange({ ...filters, entityType: event.target.value || undefined })}
        >
          <option value="">Any</option>
          {ENTITY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="activity-log-entity-id">Entity ID</Label>
        <Input
          id="activity-log-entity-id"
          placeholder="UUID"
          className="w-full sm:w-64"
          value={filters.entityId ?? ''}
          onChange={(event) => onChange({ ...filters, entityId: event.target.value || undefined })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="activity-log-date-from">From</Label>
        <Input
          id="activity-log-date-from"
          type="date"
          value={filters.dateFrom?.slice(0, 10) ?? ''}
          onChange={(event) =>
            onChange({ ...filters, dateFrom: event.target.value ? `${event.target.value}T00:00:00Z` : undefined })
          }
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="activity-log-date-to">To</Label>
        <Input
          id="activity-log-date-to"
          type="date"
          value={filters.dateTo?.slice(0, 10) ?? ''}
          onChange={(event) =>
            onChange({ ...filters, dateTo: event.target.value ? `${event.target.value}T23:59:59Z` : undefined })
          }
        />
      </div>
    </div>
  );
}
