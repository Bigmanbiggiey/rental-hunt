import { SlidersHorizontal } from 'lucide-react';
import {
  Button,
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui';
import { FilterFields, type FilterFieldsProps } from './FilterFields';

/** DISC-003 — mobile filters, collapsed behind a "Filters" button (`ui-guidelines.md` §13.3). */
export function FilterDrawer(props: FilterFieldsProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="sm:hidden">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col gap-6 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <FilterFields {...props} />
        <SheetClose asChild>
          <Button className="mt-auto">Show results</Button>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}
