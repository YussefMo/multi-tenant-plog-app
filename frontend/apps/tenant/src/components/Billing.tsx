import { useEffect } from 'react';
import { CreditCard, FileText, ReceiptText, Rocket } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Spinner } from '@multi-tenant-plog/shared/components/components-parts';
import { notify } from '@multi-tenant-plog/shared/lib/toast';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@multi-tenant-plog/shared/ui/card';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import InvoiceTable from '@/components/billing/InvoiceTable';
import PaymentTable from '@/components/billing/PaymentTable';
import SubscriptionCard from '@/components/billing/SubscriptionCard';
import {
  useCancelSubscription,
  useInvoices,
  usePayments,
  usePortal,
  useStartTrial,
  useSubscription,
} from '@/lib/hooks/billing.hook';
import { useTenant } from '@/lib/hooks/tenant.hook';

export default function Billing() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const subscriptionQuery = useSubscription();
  const tenantQuery = useTenant();
  const invoicesQuery = useInvoices({ per_page: 5 });
  const paymentsQuery = usePayments({ per_page: 5 });
  const portal = usePortal();
  const cancel = useCancelSubscription();
  const trial = useStartTrial();

  const tenant = tenantQuery.data;
  const canStartTrial = Boolean(tenant && tenant.trial_used_at === null && !subscriptionQuery.data);
  const isDue = tenant?.is_due ?? false;

  useEffect(() => {
    if (status === 'success') {
      notify.success('Checkout completed.');
    } else if (status === 'cancelled') {
      notify.warning('Checkout cancelled.');
    } else if (status === 'portal') {
      notify.info('Returned from the billing portal.');
    }
  }, [status]);

  if (subscriptionQuery.isLoading) {
    return <Spinner />;
  }

  if (subscriptionQuery.isError) {
    return (
      <ErrorPanel
        error={subscriptionQuery.error}
        onRetry={() => void subscriptionQuery.refetch()}
      />
    );
  }

  const handlePortal = () => {
    portal.mutate(undefined, {
      onSuccess: (result) => window.location.assign(result.portal_url),
      onError: (error) => notify.apiError(error, 'Unable to open the billing portal.'),
    });
  };

  const handleCancel = () => {
    cancel.mutate(undefined, {
      onSuccess: () => notify.success('Subscription will cancel at period end.'),
      onError: (error) => notify.apiError(error, 'Unable to cancel the subscription.'),
    });
  };

  const handleTrial = () => {
    trial.mutate(undefined, {
      onSuccess: () => notify.success('Trial started. Access is restored.'),
      onError: (error) => notify.apiError(error, 'Unable to start the trial.'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Billing"
        description="Manage the subscription, invoices, and payments."
        actions={
          <Button asChild variant="outline">
            <Link to="/billing/plans">View plans</Link>
          </Button>
        }
      />

      {isDue || canStartTrial ? (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">
                {isDue ? 'Tenant is marked due' : 'Free trial available'}
              </p>
              <p className="text-muted-foreground text-sm">
                {canStartTrial
                  ? 'Start a free trial to restore write access, or choose a plan now.'
                  : 'The trial has already been used. Choose a plan to restore access.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {canStartTrial ? (
                <Button type="button" disabled={trial.isPending} onClick={handleTrial}>
                  <Rocket className="size-4" />
                  {trial.isPending ? 'Starting…' : 'Start free trial'}
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link to="/billing/plans">View plans</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SubscriptionCard
            subscription={subscriptionQuery.data ?? null}
            onPortal={handlePortal}
            onCancel={handleCancel}
            isPortalPending={portal.isPending}
            isCancelPending={cancel.isPending}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Billing shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/billing/plans">
                <CreditCard className="size-4" />
                Plans and checkout
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/billing/invoices">
                <FileText className="size-4" />
                Invoices
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/billing/payments">
                <ReceiptText className="size-4" />
                Payments
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4 overflow-hidden py-0">
        <CardHeader className="p-4">
          <CardTitle>Recent invoices</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <InvoiceTable
            invoices={invoicesQuery.data?.data ?? []}
            isLoading={invoicesQuery.isLoading}
          />
        </CardContent>
      </Card>

      <Card className="mt-4 overflow-hidden py-0">
        <CardHeader className="p-4">
          <CardTitle>Recent payments</CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <PaymentTable
            payments={paymentsQuery.data?.data ?? []}
            isLoading={paymentsQuery.isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
