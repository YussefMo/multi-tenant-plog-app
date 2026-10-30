import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePathname, useSearchParams } from '@shared/lib/router';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shared/ui/select';

export interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectProps {
  options: FilterOption[];
  paramKey?: string;
  placeholder?: string;
  className?: string;
}

export default function FilterSelect({
  options,
  paramKey = 'filter',
  placeholder = 'Select…',
  className,
}: FilterSelectProps) {
  const navigate = useNavigate();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramKey) ?? '');

  useEffect(() => {
    setValue(searchParams.get(paramKey) ?? '');
  }, [paramKey, searchParams]);

  const change = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const normalized = next === '__all__' ? '' : next;

    if (normalized) {
      params.set(paramKey, normalized);
    } else {
      params.delete(paramKey);
    }

    params.set('page', '1');
    setValue(normalized);
    const query = params.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <Select value={value || '__all__'} onValueChange={change}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
