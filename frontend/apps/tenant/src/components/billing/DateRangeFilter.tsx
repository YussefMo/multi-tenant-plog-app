import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Input } from '@multi-tenant-plog/shared/ui/input';
import { Label } from '@multi-tenant-plog/shared/ui/label';

export default function DateRangeFilter() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [from, setFrom] = useState(searchParams.get('from') ?? '');
  const [to, setTo] = useState(searchParams.get('to') ?? '');

  useEffect(() => {
    setFrom(searchParams.get('from') ?? '');
    setTo(searchParams.get('to') ?? '');
  }, [searchParams]);

  const apply = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (from) {
      params.set('from', from);
    } else {
      params.delete('from');
    }

    if (to) {
      params.set('to', to);
    } else {
      params.delete('to');
    }

    params.delete('page');
    const query = params.toString();
    navigate(query ? `${location.pathname}?${query}` : location.pathname);
  };

  const clear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('from');
    params.delete('to');
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
