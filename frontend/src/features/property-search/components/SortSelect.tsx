import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui';
import type { PropertySortOrder } from '@/entities/property';

const OPTIONS: { value: PropertySortOrder; label: string }[] = [
  { value: 'newest', label: 'Newest listed' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

interface SortSelectProps {
  value: PropertySortOrder;
  onChange: (value: PropertySortOrder) => void;
}

/** DISC-004 — sort applies to the current filtered result set (selected sort order persists while filters remain applied, since it's stored in the same URL). */
export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as PropertySortOrder)}>
      <SelectTrigger aria-label="Sort properties" className="w-[180px]">
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
