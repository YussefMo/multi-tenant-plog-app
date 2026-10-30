import {
  TableBodyEmpty,
  TableBodySkeleton,
  TableHeaderRe,
} from '@multi-tenant-plog/shared/components/components-parts';
import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@multi-tenant-plog/shared/ui/table';
import { formatCurrency, formatDate, titleCase } from '@/lib/format';
import type { BillingInvoice, BillingPayment } from '@/lib/types/billing.type';

interface RecentBillingTableProps {
  invoices: BillingInvoice[];
  payments: BillingPayment[];
  isLoading?: boolean;
}

export default function RecentBillingTable({
  invoices,
  payments,
  isLoading = false,
}: RecentBillingTableProps) {
  return (
    <Table>
      <TableHeaderRe headers={['Type', 'Reference', 'Amount', 'Status', 'Date']} />
      {isLoading ? (
        <TableBodySkeleton colNum={5} rowCount={5} />
      ) : invoices.length === 0 && payments.length === 0 ? (
        <TableBodyEmpty
          title="No billing history"
          description="Invoices and payments appear here."
        />
      ) : (
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={`invoice-${invoice.id}`}>
              <TableCell className="px-4 py-3 text-sm">Invoice</TableCell>
              <TableCell className="px-4 py-3 font-mono text-xs">
                {invoice.stripe_invoice_id}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {formatCurrency(invoice.total, invoice.currency)}
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge variant="outline">{titleCase(invoice.status)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {formatDate(invoice.created_at)}
              </TableCell>
            </TableRow>
          ))}
          {payments.map((payment) => (
            <TableRow key={`payment-${payment.id}`}>
              <TableCell className="px-4 py-3 text-sm">Payment</TableCell>
              <TableCell className="px-4 py-3 font-mono text-xs">
                {payment.stripe_charge_id ?? payment.stripe_payment_intent_id ?? '—'}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {formatCurrency(payment.amount, payment.currency)}
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge variant="outline">{titleCase(payment.status)}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {formatDate(payment.paid_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
}
