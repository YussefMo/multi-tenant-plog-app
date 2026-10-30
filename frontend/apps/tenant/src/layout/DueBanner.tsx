import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { useTenantMe } from '@/lib/hooks/auth.hook';

export default function DueBanner() {
  const { data: user } = useTenantMe();

  if (!user?.tenant?.is_due) {
    return null;
  }

  return (
    <div className="border-destructive/30 bg-destructive/10 px-4 py-2">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2">
        <p className="text-destructive flex items-center gap-2 text-sm">
          <AlertTriangle className="size-4" aria-hidden />
          This tenant is marked due. Renew or subscribe to a plan to restore write access.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to="/billing">Renew / subscribe</Link>
        </Button>
      </div>
    </div>
  );
}
