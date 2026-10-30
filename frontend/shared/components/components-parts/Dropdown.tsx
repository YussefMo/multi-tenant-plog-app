import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';
import { useFormContext, type FieldValues, type Path } from 'react-hook-form';
import { Button } from '@shared/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@shared/ui/command';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@shared/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@shared/ui/popover';
import { cn } from '@shared/lib/utils';

export interface OptionType {
  key: string | number | null;
  name: string;
}

interface DropdownProps<T extends FieldValues> {
  name: Path<T>;
  label?: string;
  placeholder?: string;
  options: OptionType[];
  disabled?: boolean;
  clearable?: boolean;
  labelClassName?: string;
  triggerClassName?: string;
}

export function Dropdown({
  name,
  label,
  placeholder = 'Select an option',
  options,
  disabled = false,
  clearable = false,
  labelClassName,
  triggerClassName,
}: DropdownProps<FieldValues>) {
  const { control, setValue } = useFormContext();
  const [open, setOpen] = useState(false);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = options.find((option) => String(option.key) === String(field.value));

        return (
          <FormItem className="flex flex-col" data-field={name}>
            <FormLabel className={labelClassName}>{label}</FormLabel>
            <div className="relative flex items-center">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      type="button"
                      role="combobox"
                      aria-expanded={open}
                      disabled={disabled}
                      className={cn('w-full justify-between font-normal', triggerClassName)}
                    >
                      <span className={cn('truncate', !selected && 'text-muted-foreground')}>
                        {selected?.name ?? placeholder}
                      </span>
                      {!(clearable && field.value) ? (
                        <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
                      ) : null}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search…" />
                    <CommandList>
                      <CommandEmpty>No results found.</CommandEmpty>
                      <CommandGroup>
                        {options.map((option) => (
                          <CommandItem
                            key={option.key ?? option.name}
                            value={option.name}
                            onSelect={() => {
                              setValue(name, option.key);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'text-primary me-2 size-4',
                                String(field.value) === String(option.key)
                                  ? 'opacity-100'
                                  : 'opacity-0',
                              )}
                            />
                            {option.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {clearable && field.value ? (
                <button
                  type="button"
                  onClick={() => setValue(name, null, { shouldDirty: true })}
                  aria-label={label ? `Clear ${label}` : 'Clear selection'}
                  className="text-muted-foreground hover:text-foreground absolute end-3 flex size-6 items-center justify-center rounded-full"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export default Dropdown;
