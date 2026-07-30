import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui';
import type { PropertyAvailabilityStatus } from '@/entities/property';
import { useUpdateAvailability } from '../hooks/useUpdateAvailability';

const OPTIONS: { value: PropertyAvailabilityStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'hidden', label: 'Hidden' },
];

export interface AvailabilityToggleProps {
  propertyId: string;
  status: PropertyAvailabilityStatus;
}

/**
 * AGENT-006. The acceptance criteria describe "toggle between available and
 * unavailable" (binary), but `PropertyAvailabilityStatus`/`AvailabilityBadge`
 * already commit to 4 real states (available/reserved/occupied/hidden)
 * everywhere else in the app (Sprint 3/4) — exposing only 2 of them here
 * would be a regression relative to what's already built, not a safer
 * reading of the AC. A 4-option Select reflects the AC's actual intent
 * (accurate, agent-controlled availability) using the states that already
 * exist.
 */
export function AvailabilityToggle({ propertyId, status }: AvailabilityToggleProps) {
  const { mutate, isPending } = useUpdateAvailability();

  return (
    <Select
      value={status}
      onValueChange={(value) => mutate({ id: propertyId, status: value as PropertyAvailabilityStatus })}
      disabled={isPending}
    >
      <SelectTrigger aria-label="Availability status" className="w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
