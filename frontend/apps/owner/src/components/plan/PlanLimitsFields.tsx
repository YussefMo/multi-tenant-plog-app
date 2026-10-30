import { Input } from '@multi-tenant-plog/shared/ui/input';
import { Label } from '@multi-tenant-plog/shared/ui/label';

interface PlanLimitsFieldsProps {
  maxUsers: string;
  maxPosts: string;
  onChange: (field: 'max_users' | 'max_posts', value: string) => void;
}

export default function PlanLimitsFields({ maxUsers, maxPosts, onChange }: PlanLimitsFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="max_users">Max users</Label>
        <Input
          id="max_users"
          type="number"
          min={-1}
          value={maxUsers}
          placeholder="-1 for unlimited"
          onChange={(event) => onChange('max_users', event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="max_posts">Max posts</Label>
        <Input
          id="max_posts"
          type="number"
          min={-1}
          value={maxPosts}
          placeholder="-1 for unlimited"
          onChange={(event) => onChange('max_posts', event.target.value)}
        />
      </div>
    </div>
  );
}
