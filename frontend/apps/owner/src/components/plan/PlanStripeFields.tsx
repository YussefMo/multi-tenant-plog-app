import { Input } from '@multi-tenant-plog/shared/ui/input';
import { Label } from '@multi-tenant-plog/shared/ui/label';

interface PlanStripeFieldsProps {
  productId: string;
  priceId: string;
  onChange: (field: 'stripe_product_id' | 'stripe_price_id', value: string) => void;
}

export default function PlanStripeFields({ productId, priceId, onChange }: PlanStripeFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="stripe_product_id">Stripe product ID</Label>
        <Input
          id="stripe_product_id"
          value={productId}
          placeholder="prod_…"
          onChange={(event) => onChange('stripe_product_id', event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="stripe_price_id">Stripe price ID</Label>
        <Input
          id="stripe_price_id"
          value={priceId}
          placeholder="price_…"
          onChange={(event) => onChange('stripe_price_id', event.target.value)}
        />
      </div>
    </div>
  );
}
