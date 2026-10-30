import { Checkbox } from '@multi-tenant-plog/shared/ui/checkbox';
import { Label } from '@multi-tenant-plog/shared/ui/label';
import { permissionLabel } from '@/lib/format';
import { cn } from '@multi-tenant-plog/shared/lib/utils';

interface PermissionSelectorProps {
  catalog: string[];
  selected: string[];
  onChange: (permissions: string[]) => void;
  className?: string;
}

function groupPermissions(catalog: string[]): Record<string, string[]> {
  return catalog.reduce<Record<string, string[]>>((groups, permission) => {
    const group = permission.split('.')[0] ?? 'other';
    groups[group] = [...(groups[group] ?? []), permission];

    return groups;
  }, {});
}

export default function PermissionSelector({
  catalog,
  selected,
  onChange,
  className,
}: PermissionSelectorProps) {
  const groups = groupPermissions(catalog);

  const toggle = (permission: string, checked: boolean) => {
    onChange(
      checked ? [...selected, permission] : selected.filter((value) => value !== permission),
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {Object.entries(groups).map(([group, permissions]) => (
        <div key={group} className="space-y-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            {permissionLabel(group)}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {permissions.map((permission) => (
              <div key={permission} className="flex items-start gap-2">
                <Checkbox
                  id={`permission-${permission}`}
                  checked={selected.includes(permission)}
                  onCheckedChange={(checked) => toggle(permission, checked === true)}
                />
                <Label
                  htmlFor={`permission-${permission}`}
                  className="text-sm leading-tight font-normal"
                >
                  {permissionLabel(permission)}
                  <span className="text-muted-foreground block font-mono text-[10px]">
                    {permission}
                  </span>
                </Label>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
