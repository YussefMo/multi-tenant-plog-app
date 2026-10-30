import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@shared/ui/button';
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@shared/ui/dropdown-menu';
import { usePathname, useSearchParams } from '@shared/lib/router';
import { cn } from '@shared/lib/utils';

export interface FilterOption {
  value: string;
  label: string;
}

interface StatusFilterItemsProps {
  options: FilterOption[];
  paramKey?: string;
  label?: string;
  showClear?: boolean;
  clearKeys?: string[];
}

export default function StatusFilterItems({
  options,
  paramKey = 'status',
  label = 'Status',
  showClear = true,
  clearKeys,
}: StatusFilterItemsProps) {
  const navigate = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(paramKey);
  const selected = options.find((option) => option.value === current);
  const keys = clearKeys ?? [paramKey];

  const update = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    params.set('page', '1');
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger inset>
          {label}
          {selected ? <span className="ms-auto text-xs opacity-60">({selected.label})</span> : null}
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="w-48">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onSelect={(event) => {
                event.preventDefault();
                update((params) => {
                  if (current === option.value) {
                    params.delete(paramKey);
                  } else {
                    params.set(paramKey, option.value);
                  }
                });
              }}
            >
              <Check
                className={cn(
                  'text-primary me-2 size-4',
                  current === option.value ? 'opacity-100' : 'opacity-0',
                )}
              />
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>

      {showClear ? (
        <>
          <DropdownMenuSeparator />
          <Button
            className="w-full"
            variant="outline"
            disabled={!keys.some((key) => searchParams.get(key))}
            onClick={() => update((params) => keys.forEach((key) => params.delete(key)))}
          >
            Clear
          </Button>
        </>
      ) : null}
    </>
  );
}

export { StatusFilterItems };
