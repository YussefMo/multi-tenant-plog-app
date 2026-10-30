import { Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DeleteAlert } from '@multi-tenant-plog/shared/components/app-parts';
import {
  PillButton,
  TableBodyEmpty,
  TableBodySkeleton,
  TableHeaderRe,
} from '@multi-tenant-plog/shared/components/components-parts';
import { Badge } from '@multi-tenant-plog/shared/ui/badge';
import { Table, TableBody, TableCell, TableRow } from '@multi-tenant-plog/shared/ui/table';
import { formatCurrency } from '@/lib/format';
import type { Plan } from '@/lib/types/plan.type';

interface PlanTableProps {
  plans: Plan[];
  isLoading?: boolean;
  onDelete: (plan: Plan) => void;
  pendingPlanId?: number | null;
}

export default function PlanTable({
  plans,
  isLoading = false,
  onDelete,
  pendingPlanId = null,
}: PlanTableProps) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeaderRe
        headers={['Plan', 'Amount', 'Interval', 'Subscriptions', 'Status', 'Actions']}
        lastColumnAlign="end"
      />
      {isLoading ? (
        <TableBodySkeleton colNum={6} rowCount={5} />
      ) : plans.length === 0 ? (
        <TableBodyEmpty
          title="No plans yet"
          description="Create a plan so tenants can subscribe."
        />
      ) : (
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="px-4 py-3">
                <div className="font-medium">{plan.name}</div>
                <div className="text-muted-foreground text-xs">{plan.slug}</div>
              </TableCell>
              <TableCell className="px-4 py-3 text-sm font-medium">
                {formatCurrency(plan.amount, plan.currency)}
              </TableCell>
              <TableCell className="text-muted-foreground px-4 py-3 text-sm capitalize">
                {plan.interval}
              </TableCell>
              <TableCell className="px-4 py-3 text-sm">
                <span className="font-medium">{plan.subscriptions_count}</span>
                <span className="text-muted-foreground">
                  {' '}
                  total · {plan.active_subscriptions_count} active
                </span>
              </TableCell>
              <TableCell className="px-4 py-3">
                <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                  {plan.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="px-4 py-3">
                <div className="flex items-center justify-end gap-1">
                  <PillButton
                    label="Edit plan"
                    icon={Pencil}
                    onClick={() => navigate(`/plans/${plan.id}/edit`)}
                  />
                  <DeleteAlert
                    title={`Delete ${plan.name}?`}
                    description="Plans with subscriptions cannot be deleted. The API returns a conflict in that case."
                    isPending={pendingPlanId === plan.id}
                    onConfirm={() => onDelete(plan)}
                    trigger={<PillButton label="Delete plan" icon={Trash2} />}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      )}
    </Table>
  );
}
