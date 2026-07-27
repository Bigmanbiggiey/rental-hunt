import {
  ActiveFilterChips,
  FilterBar,
  FilterDrawer,
  SearchInput,
  SortSelect,
  useSearchFilters,
} from '@/features/property-search';
import { PropertyGrid } from '@/widgets';

// DISC-001..006/SYS-003 — owns the single `useSearchFilters()` instance
// (the URL is the one source of truth) and passes derived state down to the
// search/filter/sort UI and `PropertyGrid`.
function PropertiesPage() {
  const { filters, rawFilters, setFilter, setSort, clearFilters } = useSearchFilters();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          value={rawFilters.q ?? ''}
          onSubmit={(value) => setFilter('q', value)}
          placeholder="Search by neighborhood or county…"
        />
        <FilterDrawer rawFilters={rawFilters} setFilter={setFilter} />
        <SortSelect value={filters.sort ?? 'newest'} onChange={setSort} />
      </div>

      <FilterBar rawFilters={rawFilters} setFilter={setFilter} />

      <ActiveFilterChips rawFilters={rawFilters} setFilter={setFilter} />

      <PropertyGrid rawFilters={rawFilters} onClearFilters={clearFilters} />
    </div>
  );
}

export { PropertiesPage };
