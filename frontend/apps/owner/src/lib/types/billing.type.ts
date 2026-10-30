export interface BillingPeriod {
  from: string | null;
  to: string | null;
}

export interface BillingSubscriptionCounts {
  active: number;
  trialing: number;
  past_due: number;
  canceled: number;
  total: number;
}

export interface BillingRevenue {
  gross: number;
  refunds: number;
  net: number;
}

export interface PlanDistributionEntry {
  plan_id: number | null;
  plan: string | null;
  count: number;
  mrr: number;
}

export interface RevenueByTenantEntry {
  tenant_id: number;
  tenant: string | null;
  gross_revenue: number;
  refunds: number;
  net_revenue: number;
}

export interface TimelineEntry {
  period: string;
  label: string;
  timestamp: string;
  gross: number;
  refunds: number;
  net: number;
  payments: number;
  failed_payments: number;
  disputes: number;
}

export interface BillingMetrics {
  period: BillingPeriod;
  mrr: number;
  arr: number;
  currency: string;
  subscriptions: BillingSubscriptionCounts;
  revenue: BillingRevenue;
  failed_payments: number;
  disputes: number;
  payment_status_counts: Record<string, number>;
  churn_rate: number;
  plan_distribution: PlanDistributionEntry[];
  revenue_by_tenant: RevenueByTenantEntry[];
  timeline: TimelineEntry[];
}

export interface BillingPayment {
  id: number;
  type: string;
  tenant_id: number;
  stripe_charge_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  amount: number;
  amount_refunded: number;
  currency: string;
  status: string;
  paid_at: string | null;
  tenant: { id: number; name: string } | null;
  created_at: string | null;
}

export interface BillingMetricsParams {
  from?: string;
  to?: string;
}

export interface TransactionListParams {
  tenant_id?: number;
  status?: string;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}
