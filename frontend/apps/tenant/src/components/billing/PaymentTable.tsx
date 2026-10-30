import {
  TableBodyEmpty,
  TableBodySkeleton,
  TableHeaderRe,
} from '@multi-tenant-plog/shared/components/components-parts';
import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@multi-tenant-plog/shared/ui/table';
import { formatCurrency, formatDateTime, titleCase } from '@/lib/format';
import type { BillingPayment } from '@/lib/types/billing.type';

interface PaymentTableProps {
  payments: BillingPayment[];
  isLoading?: boolean;
}

export default function PaymentTable({ payments, isLoading = false }: PaymentTableProps) {
  return (
    <Table>
      <TableHeaderRe headers={['Payment', 'Amount', 'Refunded', 'Status', 'Paid at']} />
      {isLoading ? (
        <TableBodySkeleton colNum={5} rowCount={8} />
      ) : payments.length === 0 ? (
        <TableBodyEmpty title="No payments" description="Payments appear after billing starts." />
      ) : (
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="px-4 py-3 font-mono text-xs">
                {payment.stripe_charge_id ?? payment.stripe_payment_intent_id ?? '—'}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {formatCurrency(payment.amount, payment.currency)}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {formatCurrency(payment.amount_refunded, payment.currency)}
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge variant="outline">{titleCase(payment.status)}</Badge>
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
