import { ArrowDownUp, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@shared/ui/dropdown-menu';
import { usePathname, useSearchParams } from '@shared/lib/router';
import { cn } from '@shared/lib/utils';
import type { FilterOption } from './StatusFilterItems';

interface TableSortPillProps {
  options: FilterOption[];
  defaultSort?: string;
  label?: string;
}

export default function TableSortPill({
  options,
  defaultSort = 'id',
  label = 'Sort',
}: TableSortPillProps) {
  const navigate = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sort = searchParams.get('sort') ?? defaultSort;
  const direction = searchParams.get('dir') === 'desc' ? 'desc' : 'asc';
  const active = options.find((option) => option.value === sort);

  const write = (nextSort: string, nextDirection: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (nextSort === defaultSort && nextDirection === 'asc') {
      params.delete('sort');
      params.delete('dir');
    } else {
      params.set('sort', nextSort);
      params.set('dir', nextDirection);
    }

    params.set('page', '1');
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname, { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'border-input bg-background hover:bg-accent inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm',
            searchParams.get('sort') && 'border-primary text-primary',
          )}
        >
          <ArrowDownUp className="size-4" />
          <span className="whitespace-nowrap">{active?.label ?? label}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onSelect={(event) => {
              event.preventDefault();
              write(option.value, direction);
            }}
          >
            <Check
              className={cn(
                'text-primary me-2 size-4',
                sort === option.value ? 'opacity-100' : 'opacity-0',
              )}
            />
            {option.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {(['asc', 'desc'] as const).map((value) => (
          <DropdownMenuItem
            key={value}
            onSelect={(event) => {
              event.preventDefault();
              write(sort, value);
            }}
          >
            <Check
              className={cn(
                'text-primary me-2 size-4',
                direction === value ? 'opacity-100' : 'opacity-0',
              )}
            />
            {value === 'asc' ? 'Ascending' : 'Descending'}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
