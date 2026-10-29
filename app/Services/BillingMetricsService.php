<?php

namespace App\Services;

use App\Models\BillingPayment;
use App\Models\Subscription;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class BillingMetricsService
{
  /**
   * @return array<string, mixed>
   */
  public function summary(?Carbon $from = null, ?Carbon $to = null): array
  {
    $subscriptions = Subscription::query()->with('plan')->get();
    $activeSubscriptions = $subscriptions->whereIn('status', ['active', 'trialing']);

    $statusCounts = $subscriptions
      ->groupBy('status')
      ->map(fn ($group) => $group->count());

    $mrr = (int) $activeSubscriptions
      ->sum(fn (Subscription $subscription) => $subscription->plan?->monthlyAmount() ?? 0);

    $totalSubscriptions = $subscriptions->count();
    $canceledSubscriptions = (int) ($statusCounts['canceled'] ?? 0);

    $paymentQuery = $this->paymentQuery($from, $to);
    $collectedQuery = $this->collectedPaymentQuery($from, $to);
    $grossRevenue = (int) (clone $collectedQuery)->sum('amount');
    $refunds = (int) (clone $collectedQuery)->sum('amount_refunded');
    $failedPayments = (clone $paymentQuery)->where('status', 'failed')->count();
    $disputes = (clone $paymentQuery)->where('status', 'disputed')->count();

    return [
      'period' => [
        'from' => $from?->toIso8601String(),
        'to' => $to?->toIso8601String(),
      ],
      'mrr' => $mrr,
      'arr' => $mrr * 12,
      'currency' => (string) config('billing.default_currency', 'usd'),
      'subscriptions' => [
        'active' => (int) ($statusCounts['active'] ?? 0),
        'trialing' => (int) ($statusCounts['trialing'] ?? 0),
        'past_due' => (int) ($statusCounts['past_due'] ?? 0),
        'canceled' => $canceledSubscriptions,
        'total' => $totalSubscriptions,
      ],
      'revenue' => [
        'gross' => $grossRevenue,
        'refunds' => $refunds,
        'net' => $grossRevenue - $refunds,
      ],
      'failed_payments' => $failedPayments,
      'disputes' => $disputes,
      'churn_rate' => $totalSubscriptions === 0
        ? 0.0
        : round(($canceledSubscriptions / $totalSubscriptions) * 100, 2),
      'plan_distribution' => $this->planDistribution($activeSubscriptions),
      'revenue_by_tenant' => $this->revenueByTenant($from, $to),
    ];
  }

  /**
   * @param  \Illuminate\Support\Collection<int, Subscription>  $subscriptions
   * @return array<int, array<string, mixed>>
   */
  private function planDistribution($subscriptions): array
  {
    return $subscriptions
      ->groupBy(fn (Subscription $subscription) => $subscription->plan_id ?? 0)
      ->map(function ($group): array {
        /** @var \Illuminate\Support\Collection<int, Subscription> $group */
        $first = $group->first();
        $plan = $first instanceof Subscription ? $first->plan : null;

        return [
          'plan_id' => $plan?->id,
          'plan' => $plan?->name,
          'count' => $group->count(),
          'mrr' => (int) $group->sum(fn (Subscription $subscription) => $subscription->plan?->monthlyAmount() ?? 0),
        ];
      })
      ->values()
      ->all();
  }

  /**
   * @return array<int, array<string, mixed>>
   */
  private function revenueByTenant(?Carbon $from, ?Carbon $to): array
  {
    return $this->collectedPaymentQuery($from, $to)
      ->selectRaw('tenant_id, SUM(amount) as gross_revenue, SUM(amount_refunded) as refunds')
      ->groupBy('tenant_id')
      ->with('tenant:id,name')
      ->get()
      ->map(fn (BillingPayment $payment): array => [
        'tenant_id' => $payment->tenant_id,
        'tenant' => $payment->tenant?->name,
        'gross_revenue' => (int) data_get($payment, 'gross_revenue'),
        'refunds' => (int) data_get($payment, 'refunds'),
        'net_revenue' => (int) data_get($payment, 'gross_revenue') - (int) data_get($payment, 'refunds'),
      ])
      ->all();
  }

  /**
   * @return Builder<BillingPayment>
   */
  private function paymentQuery(?Carbon $from, ?Carbon $to): Builder
  {
    return BillingPayment::query()
      ->when($from !== null, fn (Builder $query) => $query->where('paid_at', '>=', $from))
      ->when($to !== null, fn (Builder $query) => $query->where('paid_at', '<=', $to));
  }

  /**
   * @return Builder<BillingPayment>
   */
  private function collectedPaymentQuery(?Carbon $from, ?Carbon $to): Builder
  {
    return $this->paymentQuery($from, $to)
      ->whereIn('status', ['succeeded', 'partially_refunded', 'refunded']);
  }
}
