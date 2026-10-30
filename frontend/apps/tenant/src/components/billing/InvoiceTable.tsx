import {
  TableBodyEmpty,
  TableBodySkeleton,
  TableHeaderRe,
} from '@multi-tenant-plog/shared/components/components-parts';
import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@multi-tenant-plog/shared/ui/table';
import { formatCurrency, formatDate, titleCase } from '@/lib/format';
import type { BillingInvoice } from '@/lib/types/billing.type';

interface InvoiceTableProps {
  invoices: BillingInvoice[];
  isLoading?: boolean;
}

export default function InvoiceTable({ invoices, isLoading = false }: InvoiceTableProps) {
  return (
    <Table>
      <TableHeaderRe
        headers={['Invoice', 'Status', 'Total', 'Paid', 'Due', 'Period', 'Link']}
        lastColumnAlign="end"
      />
      {isLoading ? (
        <TableBodySkeleton colNum={7} rowCount={8} />
      ) : invoices.length === 0 ? (
        <TableBodyEmpty title="No invoices" description="Invoices appear after billing starts." />
      ) : (
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.id}>
              <TableCell className="px-4 py-3 font-mono text-xs">
                {invoice.stripe_invoice_id}
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge variant="outline">{titleCase(invoice.status)}</Badge>
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {formatCurrency(invoice.total, invoice.currency)}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {formatCurrency(invoice.amount_paid, invoice.currency)}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {formatCurrency(invoice.amount_due, invoice.currency)}
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {formatDate(invoice.period_start)} – {formatDate(invoice.period_end)}
              </TableCell>
              <TableCell className="px-4 py-3 text-end text-sm">
                {invoice.hosted_invoice_url ? (
                  <a
                    href={invoice.hosted_invoice_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    Open
                  </a>
                ) : (
                  '—'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
}
