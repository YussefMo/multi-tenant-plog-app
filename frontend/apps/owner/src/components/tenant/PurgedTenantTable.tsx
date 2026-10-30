import type { ReactNode } from 'react';
import {
  TableBodyEmpty,
  TableBodySkeleton,
  TableHeaderRe,
} from '@multi-tenant-plog/shared/components/components-parts';
import { Table, TableBody, TableCell, TableRow } from '@multi-tenant-plog/shared/ui/table';
import { formatDateTime } from '@/lib/format';
import type { TenantPurge } from '@/lib/types/tenant.type';

interface PurgedTenantTableProps {
  purges: TenantPurge[];
  isLoading?: boolean;
  emptyAction?: ReactNode;
}

export default function PurgedTenantTable({
  purges,
  isLoading = false,
  emptyAction,
}: PurgedTenantTableProps) {
  return (
    <Table>
      <TableHeaderRe headers={['Tenant', 'Admin email', 'Purged at', 'Purged by', 'Snapshot']} />
      {isLoading ? (
        <TableBodySkeleton colNum={5} rowCount={6} />
      ) : purges.length === 0 ? (
        <TableBodyEmpty
          title="Nothing purged yet"
          description="Permanently deleted tenants are recorded here as a read-only history."
        >
          {emptyAction}
        </TableBodyEmpty>
      ) : (
        <TableBody>
          {purges.map((purge) => (
            <TableRow key={purge.id}>
              <TableCell className="px-4 py-3">
                <div className="font-medium">{purge.tenant_name}</div>
                <div className="text-muted-foreground text-xs">#{purge.tenant_id}</div>
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {purge.admin_email ?? '—'}
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {formatDateTime(purge.purged_at)}
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {purge.purged_by_owner_id
                  ? `Owner #${purge.purged_by_owner_id}`
                  : 'Scheduled purge'}
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-xs">
                {purge.snapshot ? 'Recorded' : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
}
