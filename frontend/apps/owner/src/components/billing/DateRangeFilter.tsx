import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Input } from '@multi-tenant-plog/shared/ui/input';
import { Label } from '@multi-tenant-plog/shared/ui/label';

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
        <Input
          id="from"
          type="date"
          value={from}
          className="w-40"
          onChange={(event) => setFrom(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="to" className="text-xs">
          To
        </Label>
        <Input
          id="to"
          type="date"
          value={to}
          className="w-40"
          onChange={(event) => setTo(event.target.value)}
        />
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
