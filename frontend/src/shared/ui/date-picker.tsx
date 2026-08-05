import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from '@/shared/lib/utils';

/** Formats using local date components, not `toISOString()` — the latter converts to UTC and can shift the date near midnight. */
function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateString(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export interface DatePickerProps {
  /** `YYYY-MM-DD`, or `''` when nothing is selected — the same string shape the booking Zod schemas already validate. */
  value: string;
  onChange: (value: string) => void;
  /** Dates before this are disabled in the calendar itself. Defaults to today, matching the schemas' own `>= today` rule. */
  minDate?: Date;
  id?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

// Added 2026-08-05 (BookingRequestDialog/RescheduleBookingDialog — a real
// calendar instead of the bare native `type="date"` input). Composed on
// Popover + Calendar, the same "Radix doesn't cover this, build it on
// Popover" precedent Combobox already established.
export function DatePicker({
  value,
  onChange,
  minDate,
  id,
  disabled,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selected = parseDateString(value);
  const min = minDate ?? startOfToday();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className={cn('w-full justify-start font-normal', !selected && 'text-muted-foreground')}
        >
          <CalendarIcon className="size-4" aria-hidden="true" />
          {selected
            ? selected.toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
            : 'Choose a date'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(date) => {
            if (!date) return;
            onChange(toDateString(date));
            setOpen(false);
          }}
          disabled={(date) => date < min}
          defaultMonth={selected ?? min}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
