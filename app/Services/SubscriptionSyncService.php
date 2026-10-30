<?php

namespace App\Services;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Support\Carbon;

class SubscriptionSyncService
{
  private const DUE_STATUSES = ['past_due', 'unpaid', 'incomplete'];

  /**
   * @param  array<string, mixed>  $subscription
   */
  public function sync(array $subscription): ?Subscription
  {
    $stripeSubscriptionId = $this->stringValue(data_get($subscription, 'id'));

    if ($stripeSubscriptionId === null) {
      return null;
    }

    $tenant = $this->tenantFor($subscription);

    if (! $tenant instanceof Tenant) {
      return null;
    }

    $customerId = $this->stringValue(data_get($subscription, 'customer'));

    if ($customerId !== null && $tenant->stripe_customer_id !== $customerId) {
      $tenant->forceFill(['stripe_customer_id' => $customerId])->saveQuietly();
    }

    $existing = Subscription::query()->where('tenant_id', $tenant->id)->first();
    $plan = $this->planFor($subscription);

    $synced = Subscription::query()->updateOrCreate(
      ['tenant_id' => $tenant->id],
      [
        'plan_id' => $plan->id ?? $existing->plan_id,
        'stripe_customer_id' => $customerId,
        'stripe_subscription_id' => $stripeSubscriptionId,
        'status' => (string) data_get($subscription, 'status', 'incomplete'),
        'current_period_start' => $this->timestamp(
          data_get($subscription, 'current_period_start')
            ?? data_get($subscription, 'items.data.0.current_period_start'),
        ),
        'current_period_end' => $this->timestamp(
          data_get($subscription, 'current_period_end')
            ?? data_get($subscription, 'items.data.0.current_period_end'),
        ),
        'trial_ends_at' => $this->timestamp(data_get($subscription, 'trial_end')),
        'cancel_at_period_end' => (bool) data_get($subscription, 'cancel_at_period_end', false),
      ],
    );

    $tenant->forceFill([
      'is_due' => in_array($synced->status, self::DUE_STATUSES, true),
    ])->saveQuietly();

    return $synced;
  }

  /**
   * @param  array<string, mixed>  $subscription
   */
  public function tenantFor(array $subscription): ?Tenant
  {
    $stripeSubscriptionId = $this->stringValue(data_get($subscription, 'id'));
    $customerId = $this->stringValue(data_get($subscription, 'customer'));

    if ($stripeSubscriptionId !== null) {
      $tenant = Subscription::query()
        ->where('stripe_subscription_id', $stripeSubscriptionId)
        ->first()
        ?->tenant;

      if ($tenant instanceof Tenant) {
        return $tenant;
      }
    }

    if ($customerId !== null) {
      $tenant = Tenant::query()
        ->where('stripe_customer_id', $customerId)
        ->first();

      if ($tenant instanceof Tenant) {
        return $tenant;
      }

      $tenant = Subscription::query()
        ->where('stripe_customer_id', $customerId)
        ->first()
        ?->tenant;

      if ($tenant instanceof Tenant) {
        return $tenant;
      }
    }

    $tenantId = data_get($subscription, 'metadata.tenant_id');

    return $tenantId === null ? null : Tenant::query()->find((int) $tenantId);
  }

  /**
   * @param  array<string, mixed>  $subscription
   */
  private function planFor(array $subscription): ?Plan
  {
    $priceId = $this->stringValue(data_get($subscription, 'items.data.0.price.id'));

    if ($priceId !== null) {
      $plan = Plan::query()->where('stripe_price_id', $priceId)->first();

      if ($plan instanceof Plan) {
        return $plan;
      }
    }

    $planId = data_get($subscription, 'metadata.plan_id');

    return $planId === null ? null : Plan::query()->find((int) $planId);
  }

  private function timestamp(mixed $value): ?Carbon
  {
    if ($value === null || $value === '') {
      return null;
    }

    return Carbon::createFromTimestamp((int) $value);
  }

  private function stringValue(mixed $value): ?string
  {
    if (! is_scalar($value)) {
      return null;
    }

    $value = (string) $value;

    return $value === '' ? null : $value;
  }
}
