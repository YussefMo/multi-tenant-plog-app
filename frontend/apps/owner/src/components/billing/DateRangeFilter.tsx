import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Label } from '@multi-tenant-plog/shared/ui/label';
import DateTextInput from '@/components/billing/DateTextInput';

interface DateRangeFilterProps {
  fromParam?: string;
  toParam?: string;
}

export default function DateRangeFilter({
  fromParam = 'from',
  toParam = 'to',
}: DateRangeFilterProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [from, setFrom] = useState(searchParams.get(fromParam) ?? '');
  const [to, setTo] = useState(searchParams.get(toParam) ?? '');

  useEffect(() => {
    setFrom(searchParams.get(fromParam) ?? '');
    setTo(searchParams.get(toParam) ?? '');
  }, [fromParam, searchParams, toParam]);

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (from) {
      params.set(fromParam, from);
    } else {
      params.delete(fromParam);
    }

    if (to) {
      params.set(toParam, to);
    } else {
      params.delete(toParam);
    }

    params.delete('page');
    const query = params.toString();
    navigate(query ? `${location.pathname}?${query}` : location.pathname);
  };

  const clear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(fromParam);
    params.delete(toParam);
    params.delete('page');
    setFrom('');
    setTo('');
    const query = params.toString();
    navigate(query ? `${location.pathname}?${query}` : location.pathname);
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <Label htmlFor="from" className="text-xs">
          From
        </Label>
        <DateTextInput id="from" value={from} className="w-40" onChange={setFrom} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to" className="text-xs">
          To
        </Label>
        <DateTextInput id="to" value={to} className="w-40" onChange={setTo} />
      </div>
      <Button type="button" variant="outline" onClick={apply}>
        Apply
      </Button>
      <Button type="button" variant="ghost" onClick={clear}>
        Clear
      </Button>
    </div>
  );
}
