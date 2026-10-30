import { LifeBuoy } from 'lucide-react';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { useSupportEnd, useTenantMe } from '@/lib/hooks/auth.hook';

export default function SupportBanner() {
  const { data: user } = useTenantMe();
  const supportEnd = useSupportEnd();

  if (!user?.support) {
    return null;
  }

  const endSession = () => {
    supportEnd.mutate(undefined, {
      onSuccess: (result) => {
        window.location.assign(result.redirect_url);
      },
      onError: (error) => notify.apiError(error, 'Unable to end support session.'),
    });
  };

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
          <LifeBuoy className="size-4" aria-hidden />
          Owner support session active. Actions are performed as the tenant.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={supportEnd.isPending}
          onClick={endSession}
        >
          {supportEnd.isPending ? 'Ending…' : 'End support session'}
        </Button>
      </div>
    </div>
  );
}
