import * as React from 'react';
import { Check, ChevronDown, Loader2, Plus } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  'aria-invalid'?: boolean;
  /**
   * When provided, typing a name with no existing match offers "Create
   * '<query>'" — calls this with the typed text and expects it to resolve
   * to the newly created option's id, which is then selected. Used by
   * PropertyForm's Location field so an agent isn't limited to the small
   * set of neighborhoods seeded so far (database.md §2 principle 8 still
   * holds: this creates a real `locations` row, it doesn't turn the field
   * into unconstrained free text on the property itself).
   */
  onCreate?: (query: string) => Promise<string>;
  createLabel?: (query: string) => string;
}

/**
 * ui-guidelines.md's Select pattern couldn't do typeahead search — Radix
 * Select has no built-in filtering, and with 47 counties (up from 4) or an
 * open-ended list of neighborhoods, click-to-scroll stopped being
 * reasonable. Standard shadcn Combobox recipe (Popover + cmdk's Command),
 * built once here and reused wherever a searchable single-select is needed,
 * rather than duplicating this per field.
 */
export function Combobox({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No results found.',
  disabled,
  onCreate,
  createLabel = (query) => `Create "${query}"`,
  ...props
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);

  const selected = options.find((option) => option.value === value);
  const trimmedQuery = query.trim();
  const hasExactMatch = options.some(
    (option) => option.label.toLowerCase() === trimmedQuery.toLowerCase(),
  );
  const showCreate = !!onCreate && trimmedQuery.length > 0 && !hasExactMatch;

  const handleCreate = async () => {
    if (!onCreate || !trimmedQuery) return;
    setIsCreating(true);
    try {
      const newValue = await onCreate(trimmedQuery);
      onValueChange(newValue);
      setOpen(false);
      setQuery('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-sm ring-offset-background focus:ring-ring focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            !selected && 'text-muted-foreground',
          )}
          {...props}
        >
          <span className="line-clamp-1">{selected ? selected.label : placeholder}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} value={query} onValueChange={setQuery} />
          <CommandList>
            {options
              .filter((option) => option.label.toLowerCase().includes(trimmedQuery.toLowerCase()))
              .map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => {
                    onValueChange(option.value);
                    setOpen(false);
                    setQuery('');
                  }}
                >
                  <Check
                    className={cn('size-4', option.value === value ? 'opacity-100' : 'opacity-0')}
                    aria-hidden="true"
                  />
                  {option.label}
                </CommandItem>
              ))}
            {showCreate && (
              <CommandItem value={`__create__${trimmedQuery}`} disabled={isCreating} onSelect={handleCreate}>
                {isCreating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="size-4" aria-hidden="true" />
                )}
                {createLabel(trimmedQuery)}
              </CommandItem>
            )}
            {!showCreate && (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
