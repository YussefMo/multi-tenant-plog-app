import type { ReactNode } from 'react';
import { Eye, LifeBuoy, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DeleteAlert } from '@multi-tenant-plog/shared/components/app-parts';
import {
  PillButton,
  TableBodyEmpty,
  TableBodySkeleton,
  TableHeaderRe,
} from '@multi-tenant-plog/shared/components/components-parts';
import { Table, TableBody, TableCell, TableRow } from '@multi-tenant-plog/shared/ui/table';
import { formatDate } from '@/lib/format';
import type { Tenant } from '@/lib/types/tenant.type';
import TenantStatusBadges from '@/components/tenant/TenantStatusBadges';

interface TenantTableProps {
  tenants: Tenant[];
  isLoading?: boolean;
  mode?: 'active' | 'trashed';
  emptyAction?: ReactNode;
  onSupport?: (tenant: Tenant) => void;
  onDelete?: (tenant: Tenant) => void;
  onRestore?: (tenant: Tenant) => void;
  onForceDelete?: (tenant: Tenant) => void;
  pendingTenantId?: number | null;
}

export default function TenantTable({
  tenants,
  isLoading = false,
  mode = 'active',
  emptyAction,
  onSupport,
  onDelete,
  onRestore,
  onForceDelete,
  pendingTenantId = null,
}: TenantTableProps) {
  const navigate = useNavigate();
  const isTrashed = mode === 'trashed';

  return (
    <Table>
      <TableHeaderRe
        headers={['Tenant', 'Category', 'Status', 'Created', isTrashed ? 'Recovery' : 'Actions']}
      />
      {isLoading ? (
        <TableBodySkeleton colNum={5} rowCount={6} />
      ) : tenants.length === 0 ? (
        <TableBodyEmpty
          title={isTrashed ? 'No deleted tenants' : 'No tenants yet'}
          description={
            isTrashed
              ? 'Soft-deleted tenants appear here until they are purged.'
              : 'Create your first tenant to get started.'
          }
        >
          {emptyAction}
        </TableBodyEmpty>
      ) : (
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="px-4 py-3">
                <div className="font-medium">{tenant.name}</div>
                <div className="text-muted-foreground text-xs">#{tenant.id}</div>
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {tenant.category ?? '—'}
              </TableCell>
              <TableCell className="px-4 py-3">
                <TenantStatusBadges tenant={tenant} />
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm">
                {formatDate(tenant.created_at)}
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  {isTrashed ? (
                    <>
                      <PillButton
                        label="Restore"
                        icon={RotateCcw}
                        disabled={pendingTenantId === tenant.id}
                        onClick={() => onRestore?.(tenant)}
                      />
                      <DeleteAlert
                        title={`Permanently delete ${tenant.name}?`}
                        description="This removes the tenant, users, posts, subscriptions, and billing mirrors forever. A purge audit row is kept."
                        confirmLabel="Delete forever"
                        isPending={pendingTenantId === tenant.id}
                        onConfirm={() => onForceDelete?.(tenant)}
                        trigger={<PillButton label="Delete forever" icon={Trash2} />}
                      />
                    </>
                  ) : (
                    <>
                      <PillButton
                        label="View tenant"
                        icon={Eye}
                        onClick={() => navigate(`/tenants/${tenant.id}`)}
                      />
                      <PillButton
                        label="Edit tenant"
                        icon={Pencil}
                        onClick={() => navigate(`/tenants/${tenant.id}/edit`)}
                      />
                      <PillButton
                        label="Support access"
                        icon={LifeBuoy}
                        disabled={!tenant.allow_support}
                        onClick={() => onSupport?.(tenant)}
                      />
                      <DeleteAlert
                        title={`Delete ${tenant.name}?`}
                        description="The tenant is moved to deleted and can be restored later."
                        isPending={pendingTenantId === tenant.id}
                        onConfirm={() => onDelete?.(tenant)}
                        trigger={<PillButton label="Delete tenant" icon={Trash2} />}
                      />
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
}
