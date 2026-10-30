import { useEffect, useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@multi-tenant-plog/shared/lib/utils';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Calendar } from '@multi-tenant-plog/shared/ui/calendar';
import { Input } from '@multi-tenant-plog/shared/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@multi-tenant-plog/shared/ui/popover';

interface DateTextInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

function toDisplay(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return value;
  }

  return `${match[3]} ${match[2]} ${match[1]}`;
}

function toIso(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed === '') {
    return '';
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (isoMatch) {
    return trimmed;
  }

  const match = /^(\d{1,2})[ /.-](\d{1,2})[ /.-](\d{4})$/.exec(trimmed);

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function toDate(value: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return undefined;
  }

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));

  return Number.isNaN(date.getTime()) ? undefined : date;
}

function fromDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

export default function DateTextInput({ id, value, onChange, className }: DateTextInputProps) {
  const [text, setText] = useState(() => toDisplay(value));
  const [invalid, setInvalid] = useState(false);
  const [open, setOpen] = useState(false);
  const selected = toDate(value);

  useEffect(() => {
    setText(toDisplay(value));
    setInvalid(false);
  }, [value]);

  const commit = () => {
    const iso = toIso(text);

    if (iso === null) {
      setInvalid(true);

      return;
    }

    setInvalid(false);
    onChange(iso);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        value={text}
        placeholder="dd mm yyyy"
        inputMode="numeric"
        aria-invalid={invalid}
        className={cn('pe-9', className)}
        onChange={(event) => setText(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
        }}
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute end-1 top-1/2 -translate-y-1/2"
            aria-label="Open date picker"
          >
            <CalendarIcon className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            onSelect={(date) => {
              if (!date) {
                setText('');
                setInvalid(false);
                onChange('');
                setOpen(false);

                return;
              }

              const iso = fromDate(date);
              setText(toDisplay(iso));
              setInvalid(false);
              onChange(iso);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
