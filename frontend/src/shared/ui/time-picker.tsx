import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

type Period = 'AM' | 'PM';

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = ['00', '15', '30', '45'];

function parseTime(value: string): { hour12: string; minute: string; period: Period } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour24 = Number(match[1]);
  const period: Period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12raw = hour24 % 12;
  return { hour12: String(hour12raw === 0 ? 12 : hour12raw), minute: match[2] ?? '00', period };
}

function toTimeString(hour12: string, minute: string, period: Period): string {
  let hour24 = Number(hour12) % 12;
  if (period === 'PM') hour24 += 12;
  return `${String(hour24).padStart(2, '0')}:${minute}`;
}

export interface TimePickerProps {
  /** 24-hour `HH:MM`, or `''` when nothing is selected — the same string shape the booking Zod schemas already validate. */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

// Added 2026-08-05 (BookingRequestDialog/RescheduleBookingDialog — a more
// robust, explicitly AM/PM time picker instead of the bare native
// `type="time"` input, which never showed AM/PM at all). Three composed
// Selects; the 12-hour+AM/PM representation never leaves this component —
// onChange always emits the same 24-hour `HH:MM` string the schemas expect.
//
// Genuinely stateful, not a pure derivation of `value` — found the hard way
// (a real bug, not a testing artifact): `onChange` only fires once both
// hour and minute are known, so if this component had no memory of its own
// beyond the external `value`, selecting the hour alone would have nothing
// to render (the parent's `value` never changed) and the minute selection
// that followed would read a stale, still-empty hour — a dead end where a
// user could never actually finish picking a time. Local state holds each
// in-progress selection immediately; it re-syncs from `value` only when
// `value` changes from *outside* this component (e.g. `form.reset()` after
// a successful submit) — done as a render-time state adjustment (comparing
// against a `prevValue` tracked in state), React's own recommended pattern
// for this, rather than a `useEffect` (which would call `setState`
// synchronously in the effect body — a real lint error this project
// enforces, not just a style preference).
export function TimePicker({
  value,
  onChange,
  id,
  disabled,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedBy,
}: TimePickerProps) {
  const initial = parseTime(value);
  const [hour12, setHour12] = useState(initial?.hour12 ?? '');
  const [minute, setMinute] = useState(initial?.minute ?? '');
  const [period, setPeriod] = useState<Period>(initial?.period ?? 'AM');
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    const parsed = parseTime(value);
    setHour12(parsed?.hour12 ?? '');
    setMinute(parsed?.minute ?? '');
    setPeriod(parsed?.period ?? 'AM');
  }

  function commit(nextHour: string, nextMinute: string, nextPeriod: Period) {
    if (nextHour && nextMinute) {
      onChange(toTimeString(nextHour, nextMinute, nextPeriod));
    }
  }

  return (
    <div className="flex gap-2">
      <Select
        value={hour12}
        onValueChange={(next) => {
          setHour12(next);
          commit(next, minute, period);
        }}
        disabled={disabled}
      >
        <SelectTrigger id={id} aria-invalid={ariaInvalid} aria-describedby={ariaDescribedBy} className="w-full">
          <SelectValue placeholder="Hour" />
        </SelectTrigger>
        <SelectContent>
          {HOURS.map((hour) => (
            <SelectItem key={hour} value={hour}>
              {hour}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={minute}
        onValueChange={(next) => {
          setMinute(next);
          commit(hour12, next, period);
        }}
        disabled={disabled}
      >
        <SelectTrigger aria-invalid={ariaInvalid} className="w-full">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((min) => (
            <SelectItem key={min} value={min}>
              {min}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={period}
        onValueChange={(next) => {
          const nextPeriod = next as Period;
          setPeriod(nextPeriod);
          commit(hour12, minute, nextPeriod);
        }}
        disabled={disabled}
      >
        <SelectTrigger aria-invalid={ariaInvalid} className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="AM">AM</SelectItem>
          <SelectItem value="PM">PM</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
