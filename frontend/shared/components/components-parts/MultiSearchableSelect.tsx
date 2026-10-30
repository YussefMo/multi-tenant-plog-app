import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@shared/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@shared/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { cn } from '@shared/lib/utils';

interface MultiSearchableSelectProps {
  options: { key: string; name: string }[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyStateMessage?: string;
  ariaLabel?: string;
  className?: string;
}

export function MultiSearchableSelect({
  options,
  values,
  onChange,
  placeholder = 'Select options',
  searchPlaceholder = 'Search…',
  emptyStateMessage = 'No results found.',
  ariaLabel,
  className,
}: MultiSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const chosen = options.filter((option) => values.includes(option.key));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={ariaLabel}
          className={cn('w-full justify-between font-normal', className)}
        >
          <span className={cn('truncate', chosen.length === 0 && 'text-muted-foreground')}>
            {chosen.length > 0 ? chosen.map((option) => option.name).join(', ') : placeholder}
          </span>
          <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyStateMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const selected = values.includes(option.key);

                return (
                  <CommandItem
                    key={option.key}
                    value={option.name}
                    onSelect={() =>
                      onChange(
                        selected
                          ? values.filter((value) => value !== option.key)
                          : [...values, option.key],
                      )
                    }
                  >
                    <Check
                      className={cn(
                        'text-primary me-2 size-4',
                        selected ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {option.name}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default MultiSearchableSelect;
