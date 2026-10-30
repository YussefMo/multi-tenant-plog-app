import { useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@multi-tenant-plog/shared/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@multi-tenant-plog/shared/ui/card';
import { Input } from '@multi-tenant-plog/shared/ui/input';
import { Label } from '@multi-tenant-plog/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@multi-tenant-plog/shared/ui/select';
import { Switch } from '@multi-tenant-plog/shared/ui/switch';
import PlanFeaturesFields from '@/components/plan/PlanFeaturesFields';
import PlanLimitsFields from '@/components/plan/PlanLimitsFields';
import PlanStripeFields from '@/components/plan/PlanStripeFields';
import { toMajorUnits, toMinorUnits } from '@/lib/format';
import type {
  CreatePlanPayload,
  Plan,
  PlanInterval,
  UpdatePlanPayload,
} from '@/lib/types/plan.type';

export interface PlanFormValues {
  name: string;
  slug: string;
  amount: string;
  currency: string;
  interval: PlanInterval;
  features: string;
  max_users: string;
  max_posts: string;
  stripe_product_id: string;
  stripe_price_id: string;
  is_active: boolean;
}

interface PlanFormProps {
  initialPlan?: Plan;
  onSubmit: (payload: CreatePlanPayload | UpdatePlanPayload) => void;
  isPending?: boolean;
  errors?: Record<string, string>;
}

function initialValues(plan?: Plan): PlanFormValues {
  return {
    name: plan?.name ?? '',
    slug: plan?.slug ?? '',
    amount: plan ? String(toMajorUnits(plan.amount)) : '',
    currency: plan?.currency ?? 'usd',
    interval: plan?.interval ?? 'month',
    features: plan?.features?.join('\n') ?? '',
    max_users: plan?.limits?.max_users !== undefined ? String(plan.limits.max_users) : '',
    max_posts: plan?.limits?.max_posts !== undefined ? String(plan.limits.max_posts) : '',
    stripe_product_id: plan?.stripe_product_id ?? '',
    stripe_price_id: plan?.stripe_price_id ?? '',
    is_active: plan?.is_active ?? true,
  };
}

export default function PlanForm({
  initialPlan,
  onSubmit,
  isPending = false,
  errors: serverErrors = {},
}: PlanFormProps) {
  const [values, setValues] = useState<PlanFormValues>(() => initialValues(initialPlan));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof PlanFormValues>(field: K, value: PlanFormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};

    if (!values.name.trim()) {
      nextErrors.name = 'Plan name is required.';
    }

    const amount = Number(values.amount);

    if (!values.amount.trim() || Number.isNaN(amount) || amount < 0) {
      nextErrors.amount = 'Enter a valid non-negative amount.';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const limits: Record<string, number> = {};

    if (values.max_users.trim() !== '') {
      limits.max_users = Number(values.max_users);
    }

    if (values.max_posts.trim() !== '') {
      limits.max_posts = Number(values.max_posts);
    }

    onSubmit({
      name: values.name.trim(),
      slug: values.slug.trim() || null,
      amount: toMinorUnits(amount),
      currency: values.currency.trim().toLowerCase() || 'usd',
      interval: values.interval,
      features: values.features
        .split(/[\n,]/)
        .map((feature) => feature.trim())
        .filter(Boolean),
      limits,
      stripe_product_id: values.stripe_product_id.trim() || null,
      stripe_price_id: values.stripe_price_id.trim() || null,
      is_active: values.is_active,
    });
  };

  const fieldError = (field: keyof PlanFormValues) => errors[field] ?? serverErrors[field];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialPlan ? 'Edit plan' : 'Plan details'}</CardTitle>
        <CardDescription>
          Amounts are entered in major units and stored as minor units by the API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={submit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={values.name}
                aria-invalid={Boolean(fieldError('name'))}
                onChange={(event) => update('name', event.target.value)}
              />
              {fieldError('name') ? (
                <p className="text-destructive text-xs">{fieldError('name')}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={values.slug}
                placeholder="auto-generated when empty"
                onChange={(event) => update('slug', event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min={0}
                step="0.01"
                value={values.amount}
                aria-invalid={Boolean(fieldError('amount'))}
                onChange={(event) => update('amount', event.target.value)}
              />
              {fieldError('amount') ? (
                <p className="text-destructive text-xs">{fieldError('amount')}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                maxLength={3}
                value={values.currency}
                onChange={(event) => update('currency', event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Interval</Label>
              <Select
                value={values.interval}
                onValueChange={(value) => update('interval', value as PlanInterval)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="year">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <PlanLimitsFields
            maxUsers={values.max_users}
            maxPosts={values.max_posts}
            onChange={(field, value) => update(field, value)}
          />

          <PlanFeaturesFields
            value={values.features}
            onChange={(value) => update('features', value)}
          />

          <PlanStripeFields
            productId={values.stripe_product_id}
            priceId={values.stripe_price_id}
            onChange={(field, value) => update(field, value)}
          />

          <div className="flex items-center gap-3">
            <Switch
              id="is_active"
              checked={values.is_active}
              onCheckedChange={(checked) => update('is_active', checked)}
            />
            <Label htmlFor="is_active" className="font-normal">
              Plan is active
            </Label>
          </div>

          <Button type="submit" disabled={isPending}>
            <Save className="size-4" />
            {isPending ? 'Saving…' : initialPlan ? 'Save changes' : 'Create plan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
