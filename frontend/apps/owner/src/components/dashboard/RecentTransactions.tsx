import {
  TableBodyEmpty,
  TableBodySkeleton,
  TableHeaderRe,
} from '@multi-tenant-plog/shared/components/components-parts';
import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@multi-tenant-plog/shared/ui/table';
import { formatCurrency, formatDateTime, titleCase } from '@/lib/format';
import type { BillingPayment } from '@/lib/types/billing.type';

interface RecentTransactionsProps {
  transactions: BillingPayment[];
  isLoading?: boolean;
}

function statusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'succeeded') return 'default';
  if (status === 'failed' || status === 'disputed') return 'destructive';
  if (status === 'refunded' || status === 'partially_refunded') return 'outline';

  return 'secondary';
}

export default function RecentTransactions({
  transactions,
  isLoading = false,
}: RecentTransactionsProps) {
  return (
    <Table>
      <TableHeaderRe headers={['Tenant', 'Amount', 'Status', 'Paid at']} />
      {isLoading ? (
        <TableBodySkeleton colNum={4} rowCount={5} />
      ) : transactions.length === 0 ? (
        <TableBodyEmpty title="No transactions" description="Payments will appear here." />
      ) : (
        <TableBody>
          {transactions.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="px-4 py-3 font-medium">
                {payment.tenant?.name ?? `Tenant #${payment.tenant_id}`}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {formatCurrency(payment.amount, payment.currency)}
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge variant={statusVariant(payment.status)}>{titleCase(payment.status)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {formatDateTime(payment.paid_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
}
