import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui';
import type {
  AgentPropertyFilters,
  PropertyAvailabilityStatus,
  PropertyVerificationStatus,
} from '@/entities/property';

export interface PropertyFiltersProps {
  filters: AgentPropertyFilters;
  onChange: (filters: AgentPropertyFilters) => void;
}

const AVAILABILITY_OPTIONS: PropertyAvailabilityStatus[] = ['available', 'reserved', 'occupied', 'hidden'];
const VERIFICATION_OPTIONS: PropertyVerificationStatus[] = [
  'unverified',
  'pending_verification',
  'verified',
  'rejected',
];

// Radix Select rejects an empty-string item value, so "no filter selected"
// needs a real sentinel rather than ''  — matches
// `features/property-search`'s reference-data Selects' own placeholder
// approach, just made explicitly resettable here (dashboard filters, per
// ui-guidelines.md §13.3, don't have the public search bar's dismissible
// filter-chip affordance).
const ANY = '__any__';

function titleCase(value: string): string {
  return value
    .split('_')
    .map((word) => (word[0] ?? '').toUpperCase() + word.slice(1))
    .join(' ');
}

/** ui-guidelines.md §13.3: dashboard table filters render inline above the table — a Select per status dimension, plus a search Input. */
export function PropertyFilters({ filters, onChange }: PropertyFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-1">
        <Label htmlFor="agent-property-search">Search</Label>
        <Input
          id="agent-property-search"
          placeholder="Search title or description"
          className="w-full sm:w-64"
          value={filters.q ?? ''}
          onChange={(event) => onChange({ ...filters, q: event.target.value || undefined })}
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="agent-property-availability">Availability</Label>
        <Select
          value={filters.availabilityStatus ?? ANY}
          onValueChange={(value) =>
            onChange({
              ...filters,
              availabilityStatus: value === ANY ? undefined : (value as PropertyAvailabilityStatus),
            })
          }
        >
          <SelectTrigger id="agent-property-availability" className="w-full sm:w-40">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {AVAILABILITY_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {titleCase(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="agent-property-verification">Verification</Label>
        <Select
          value={filters.verificationStatus ?? ANY}
          onValueChange={(value) =>
            onChange({
              ...filters,
              verificationStatus: value === ANY ? undefined : (value as PropertyVerificationStatus),
            })
          }
        >
          <SelectTrigger id="agent-property-verification" className="w-full sm:w-48">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            {VERIFICATION_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {titleCase(option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <Label htmlFor="agent-property-archived">Archived</Label>
        <Select
          value={filters.archived === undefined ? ANY : String(filters.archived)}
          onValueChange={(value) =>
            onChange({ ...filters, archived: value === ANY ? undefined : value === 'true' })
          }
        >
          <SelectTrigger id="agent-property-archived" className="w-full sm:w-40">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any</SelectItem>
            <SelectItem value="false">Active</SelectItem>
            <SelectItem value="true">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
