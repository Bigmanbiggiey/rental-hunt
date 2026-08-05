import { DayPicker, type DayPickerProps } from 'react-day-picker';
import { cn } from '@/shared/lib/utils';

export type CalendarProps = DayPickerProps;

// Thin shadcn-style wrapper around react-day-picker's DayPicker (added
// 2026-08-05 for a real calendar/date-picker in the booking-viewing flow —
// no calendar library existed in this project before). Styled with this
// project's existing design tokens rather than react-day-picker's own
// default CSS, matching how every other shared/ui primitive is themed.
function Calendar({ className, classNames, ...props }: CalendarProps) {
  return (
    <DayPicker
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col gap-4 sm:flex-row',
        month: 'flex flex-col gap-4',
        month_caption: 'flex items-center justify-center pt-1 relative',
        caption_label: 'text-body-sm font-medium text-foreground',
        nav: 'flex items-center justify-between absolute inset-x-0 top-0',
        button_previous:
          'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50',
        button_next:
          'inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50',
        chevron: 'size-4 fill-current',
        month_grid: 'w-full border-collapse',
        weekdays: 'flex',
        weekday: 'text-muted-foreground w-9 text-micro font-normal',
        weeks: 'flex flex-col gap-1 mt-2',
        week: 'flex w-full',
        day: 'p-0 text-center text-body-sm',
        day_button:
          'inline-flex size-9 items-center justify-center rounded-md font-normal hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        today: '[&>button]:border [&>button]:border-primary',
        selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground',
        outside: 'text-muted-foreground opacity-50',
        disabled: 'text-muted-foreground opacity-30 pointer-events-none',
        hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}
Calendar.displayName = 'Calendar';

export { Calendar };
