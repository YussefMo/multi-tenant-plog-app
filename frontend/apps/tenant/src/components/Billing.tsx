import { useEffect } from 'react';
import { CreditCard, FileText, ReceiptText } from 'lucide-react';
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
  useSubscription,
} from '@/lib/hooks/billing.hook';

export default function Billing() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const subscriptionQuery = useSubscription();
  const invoicesQuery = useInvoices({ per_page: 5 });
  const paymentsQuery = usePayments({ per_page: 5 });
  const portal = usePortal();
  const cancel = useCancelSubscription();

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
