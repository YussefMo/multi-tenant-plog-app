import { useSearchParams } from 'react-router-dom';
import { TableFooter, TableTally } from '@multi-tenant-plog/shared/components/components-parts';
import { Card } from '@multi-tenant-plog/shared/ui/card';
import BillingFilters from '@/components/billing/BillingFilters';
import PaymentTable from '@/components/billing/PaymentTable';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import { usePayments } from '@/lib/hooks/billing.hook';

export default function Payments() {
  const [searchParams] = useSearchParams();
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);
  const params = {
    status: searchParams.get('status') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    page,
    per_page: 15,
  };
  const paymentsQuery = usePayments(params);
  const payments = paymentsQuery.data;

  return (
    <div>
      <PageHeader title="Payments" description="Billing payments for this tenant." />

      <Card className="overflow-hidden py-0">
        <div className="border-b p-4">
          <BillingFilters />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <TableTally
            total={payments?.meta.total}
            currentPage={payments?.meta.current_page}
            lastPage={payments?.meta.last_page}
            entity="payments"
          />
        </div>

        <div className="p-4">
          {paymentsQuery.isError ? (
            <ErrorPanel error={paymentsQuery.error} onRetry={() => void paymentsQuery.refetch()} />
          ) : (
            <PaymentTable payments={payments?.data ?? []} isLoading={paymentsQuery.isLoading} />
          )}
        </div>

        {payments && payments.meta.last_page > 1 ? (
          <div className="border-t px-4">
            <TableFooter
              totalPages={payments.meta.last_page}
              from={payments.meta.from}
              to={payments.meta.to}
              total={payments.meta.total}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
