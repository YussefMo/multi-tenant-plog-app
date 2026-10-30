export interface Plan {
  id: number;
  name: string;
  slug: string;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  limits: Record<string, number>;
  is_active: boolean;
  subscriptions_count: number;
  active_subscriptions_count: number;
  created_at: string | null;
}

export interface Subscription {
  id: number;
  tenant_id: number;
  plan_id: number | null;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
  cancel_at_period_end: boolean;
  plan: Plan | null;
  features: string[];
  limits: Record<string, number>;
  created_at: string | null;
}

export interface BillingInvoice {
  id: number;
  tenant_id: number;
  stripe_invoice_id: string;
  status: string;
  currency: string;
  subtotal: number;
  tax: number;
  total: number;
  amount_paid: number;
  amount_due: number;
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
  period_start: string | null;
  period_end: string | null;
  paid_at: string | null;
  created_at: string | null;
}

export interface BillingPayment {
  id: number;
  tenant_id: number;
  stripe_charge_id: string | null;
  stripe_payment_intent_id: string | null;
  amount: number;
  amount_refunded: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string | null;
}

export interface BillingListParams {
  status?: string;
  from?: string;
  to?: string;
  per_page?: number;
  page?: number;
}

export interface CheckoutResult {
  checkout_url: string;
  session_id: string;
}

export interface PortalResult {
  portal_url: string;
}
