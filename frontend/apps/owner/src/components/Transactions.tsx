import { useSearchParams } from 'react-router-dom';
import { TableFooter, TableTally } from '@multi-tenant-plog/shared/components/components-parts';
import { Card } from '@multi-tenant-plog/shared/ui/card';
import ErrorPanel from '@/components/ErrorPanel';
import PageHeader from '@/components/PageHeader';
import TransactionsFilters from '@/components/billing/TransactionsFilters';
import TransactionsTable from '@/components/billing/TransactionsTable';
import { useTransactions } from '@/lib/hooks/billing.hook';
import { useTenants } from '@/lib/hooks/tenant.hook';
import type { TransactionListParams } from '@/lib/types/billing.type';

export default function Transactions() {
  const [searchParams] = useSearchParams();
  const page = Math.max(Number(searchParams.get('page') ?? 1), 1);
  const tenantId = Number(searchParams.get('tenant_id') ?? 0);
  const status = searchParams.get('status') ?? undefined;
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;

  const params: TransactionListParams = {
    page,
    tenant_id: tenantId > 0 ? tenantId : undefined,
    status,
    from,
    to,
  };

  const transactionsQuery = useTransactions(params);
  const tenantsQuery = useTenants({ per_page: 100 });

  const tenantOptions =
    tenantsQuery.data?.data.map((tenant) => ({
      value: String(tenant.id),
      label: tenant.name,
    })) ?? [];

  const transactions = transactionsQuery.data;

  return (
    <div>
      <PageHeader title="Transactions" description="Inspect billing payments across tenants." />

      <Card className="overflow-hidden py-0">
        <div className="border-b p-4">
          <TransactionsFilters tenantOptions={tenantOptions} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <TableTally
            total={transactions?.meta.total}
            currentPage={transactions?.meta.current_page}
            lastPage={transactions?.meta.last_page}
            entity="transactions"
          />
        </div>

        <div className="p-4">
          {transactionsQuery.isError ? (
            <ErrorPanel
              error={transactionsQuery.error}
              onRetry={() => void transactionsQuery.refetch()}
            />
          ) : (
            <TransactionsTable
              transactions={transactions?.data ?? []}
              isLoading={transactionsQuery.isLoading}
            />
          )}
        </div>

        {transactions && transactions.meta.last_page > 1 ? (
          <div className="border-t px-4">
            <TableFooter
              totalPages={transactions.meta.last_page}
              from={transactions.meta.from}
              to={transactions.meta.to}
              total={transactions.meta.total}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}
