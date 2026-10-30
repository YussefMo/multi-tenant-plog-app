import {
  TableBodyEmpty,
  TableHeaderRe,
} from '@multi-tenant-plog/shared/components/components-parts';
import { Table, TableBody, TableCell, TableRow } from '@multi-tenant-plog/shared/ui/table';
import { formatCurrency } from '@/lib/format';
import type { RevenueByTenantEntry } from '@/lib/types/billing.type';

interface RevenueByTenantTableProps {
  entries: RevenueByTenantEntry[];
  currency?: string;
}

export default function RevenueByTenantTable({
  entries,
  currency = 'usd',
}: RevenueByTenantTableProps) {
  return (
    <Table>
      <TableHeaderRe headers={['Tenant', 'Gross', 'Refunds', 'Net']} />
      {entries.length === 0 ? (
        <TableBodyEmpty title="No revenue by tenant" description="No collected payments yet." />
      ) : (
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.tenant_id}>
              <TableCell className="px-4 py-3 font-medium">
                {entry.tenant ?? `Tenant #${entry.tenant_id}`}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {formatCurrency(entry.gross_revenue, currency)}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                {formatCurrency(entry.refunds, currency)}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm font-medium">
                {formatCurrency(entry.net_revenue, currency)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
}
