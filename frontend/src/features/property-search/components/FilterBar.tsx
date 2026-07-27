import { FilterFields, type FilterFieldsProps } from './FilterFields';

/** DISC-003 — desktop horizontal filter bar (`ui-guidelines.md` §13.3). */
export function FilterBar(props: FilterFieldsProps) {
  return (
    <div className="hidden rounded-lg border border-border bg-card p-4 sm:block">
      <FilterFields {...props} />
    </div>
  );
}
