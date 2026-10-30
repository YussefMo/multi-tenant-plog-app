import { useEffect, useRef, useState } from 'react';
import { cn } from '@shared/lib/utils';

interface DateInputProps {
  value?: Date;
  onChange: (date: Date) => void;
  className?: string;
}

interface DateParts {
  day: number;
  month: number;
  year: number;
}

function partsFromDate(value?: Date): DateParts {
  const date = value ? new Date(value) : new Date();

  return { day: date.getDate(), month: date.getMonth() + 1, year: date.getFullYear() };
}

function isValid(field: keyof DateParts, value: number, current: DateParts): boolean {
  if (
    (field === 'day' && (value < 1 || value > 31)) ||
    (field === 'month' && (value < 1 || value > 12)) ||
    (field === 'year' && (value < 1000 || value > 9999))
  ) {
    return false;
  }

  const next = { ...current, [field]: value };
  const date = new Date(next.year, next.month - 1, next.day);

  return (
    date.getFullYear() === next.year &&
    date.getMonth() + 1 === next.month &&
    date.getDate() === next.day
  );
}

export function DateInput({ value, onChange, className }: DateInputProps) {
  const [date, setDate] = useState<DateParts>(() => partsFromDate(value));
  const initial = useRef(date);
  const monthRef = useRef<HTMLInputElement | null>(null);
  const dayRef = useRef<HTMLInputElement | null>(null);
  const yearRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDate(partsFromDate(value));
  }, [value]);

  const change = (field: keyof DateParts) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value ? Number(event.target.value) : 0;
    const next = { ...date, [field]: raw };
    setDate(next);

    if (isValid(field, raw, date)) {
      onChange(new Date(next.year, next.month - 1, next.day));
    }
  };

  const blur = (field: keyof DateParts) => (event: React.FocusEvent<HTMLInputElement>) => {
    if (!event.target.value || !isValid(field, Number(event.target.value), date)) {
      setDate(initial.current);
      return;
    }

    initial.current = { ...date, [field]: Number(event.target.value) };
  };

  return (
    <div className={cn('border-input flex items-center rounded-lg border px-1 text-sm', className)}>
      <input
        ref={monthRef}
        type="text"
        maxLength={2}
        value={date.month}
        onChange={change('month')}
        onBlur={blur('month')}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') dayRef.current?.focus();
        }}
        className="w-7 bg-transparent p-0 text-center outline-none"
        placeholder="MM"
      />
      <span className="opacity-40">/</span>
      <input
        ref={dayRef}
        type="text"
        maxLength={2}
        value={date.day}
        onChange={change('day')}
        onBlur={blur('day')}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') yearRef.current?.focus();
          if (event.key === 'ArrowLeft') monthRef.current?.focus();
        }}
        className="w-7 bg-transparent p-0 text-center outline-none"
        placeholder="DD"
      />
      <span className="opacity-40">/</span>
      <input
        ref={yearRef}
        type="text"
        maxLength={4}
        value={date.year}
        onChange={change('year')}
        onBlur={blur('year')}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') dayRef.current?.focus();
        }}
        className="w-12 bg-transparent p-0 text-center outline-none"
        placeholder="YYYY"
      />
    </div>
  );
}

export default DateInput;
