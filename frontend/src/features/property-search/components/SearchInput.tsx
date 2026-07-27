import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/shared/ui';

interface SearchInputProps {
  value: string;
  onSubmit: (value: string) => void;
  size?: 'default' | 'lg';
  placeholder?: string;
}

/**
 * DISC-002 — a single-purpose location search box. Reused by both the large
 * homepage hero (`size="lg"`) and the condensed sticky header on the results
 * page (`ui-guidelines.md` §13.6/§15.5) — uncontrolled-until-submit so typing
 * doesn't refetch on every keystroke.
 */
export function SearchInput({ value, onSubmit, size = 'default', placeholder }: SearchInputProps) {
  const [draft, setDraft] = useState(value);

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft.trim());
      }}
      className="relative flex-1"
    >
      <Search
        className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder ?? 'Search by neighborhood or county…'}
        aria-label="Search by location"
        className={size === 'lg' ? 'h-12 pl-10 text-body' : 'pl-9'}
      />
    </form>
  );
}
