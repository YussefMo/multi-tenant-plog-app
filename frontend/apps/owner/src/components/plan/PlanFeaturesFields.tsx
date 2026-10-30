import { Label } from '@multi-tenant-plog/shared/ui/label';
import { Textarea } from '@multi-tenant-plog/shared/ui/textarea';

interface PlanFeaturesFieldsProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PlanFeaturesFields({ value, onChange }: PlanFeaturesFieldsProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="features">Features</Label>
      <Textarea
        id="features"
        value={value}
        placeholder={'published_posts\nanalytics\nexport'}
        className="min-h-24"
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-muted-foreground text-xs">One feature key per line or comma-separated.</p>
    </div>
  );
}
