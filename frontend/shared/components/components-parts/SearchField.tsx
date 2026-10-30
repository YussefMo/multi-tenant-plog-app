import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePathname, useSearchParams } from '@shared/lib/router';
import { Input } from '@shared/ui/input';
import { cn } from '@shared/lib/utils';

interface SearchFieldProps {
  placeholder?: string;
  paramKey?: string;
  className?: string;
  debounceMs?: number;
}

export default function SearchField({
  placeholder = 'Search…',
  paramKey = 'search',
  className,
  debounceMs = 300,
}: SearchFieldProps) {
  const navigate = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramKey) ?? '');

  useEffect(() => {
    setValue(searchParams.get(paramKey) ?? '');
  }, [paramKey, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get(paramKey) ?? '';

      if (value === current) {
        return;
      }

      if (value) {
        params.set(paramKey, value);
        params.set('page', '1');
      } else {
        params.delete(paramKey);
        params.delete('page');
      }

      const query = params.toString();
      navigate(query ? `${pathname}?${query}` : pathname, { replace: true });
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [debounceMs, navigate, paramKey, pathname, searchParams, value]);

  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search className="text-muted-foreground pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="ps-9"
      />
    </div>
  );
}
