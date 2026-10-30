export type PlanInterval = 'month' | 'year';

export interface Plan {
  id: number;
  name: string;
  slug: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  amount: number;
  currency: string;
  interval: PlanInterval;
  features: string[];
  limits: Record<string, number>;
  is_active: boolean;
  subscriptions_count: number;
  active_subscriptions_count: number;
  created_at: string | null;
}

export interface CreatePlanPayload {
  name: string;
  slug?: string | null;
  stripe_product_id?: string | null;
  stripe_price_id?: string | null;
  amount: number;
  currency: string;
  interval: PlanInterval;
  features?: string[];
  limits?: Record<string, number>;
  is_active?: boolean;
}

export type UpdatePlanPayload = Partial<CreatePlanPayload>;
