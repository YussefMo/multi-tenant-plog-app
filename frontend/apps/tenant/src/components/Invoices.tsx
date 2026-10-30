import { useSearchParams } from 'react-router-dom';
import { TableFooter, TableTally } from '@multi-tenant-plog/shared/components/components-parts';
import { Card } from '@multi-tenant-plog/shared/ui/card';
import BillingFilters from '@/components/billing/BillingFilters';
import InvoiceTable from '@/components/billing/InvoiceTable';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import { useInvoices } from '@/lib/hooks/billing.hook';

export default function Invoices() {
  const [searchParams] = useSearchParams();
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);
  const params = {
    status: searchParams.get('status') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    page,
    per_page: 15,
  };
  const invoicesQuery = useInvoices(params);
  const invoices = invoicesQuery.data;

  return (
    <div>
      <PageHeader title="Invoices" description="Billing invoices for this tenant." />

      <Card className="overflow-hidden py-0">
        <div className="border-b p-4">
          <BillingFilters />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <TableTally
            total={invoices?.meta.total}
            currentPage={invoices?.meta.current_page}
            lastPage={invoices?.meta.last_page}
            entity="invoices"
          />
        </div>

        <div className="p-4">
          {invoicesQuery.isError ? (
            <ErrorPanel error={invoicesQuery.error} onRetry={() => void invoicesQuery.refetch()} />
          ) : (
            <InvoiceTable invoices={invoices?.data ?? []} isLoading={invoicesQuery.isLoading} />
          )}
        </div>

        {invoices && invoices.meta.last_page > 1 ? (
          <div className="border-t px-4">
            <TableFooter
              totalPages={invoices.meta.last_page}
              from={invoices.meta.from}
              to={invoices.meta.to}
              total={invoices.meta.total}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
