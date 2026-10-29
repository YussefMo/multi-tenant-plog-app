<?php

namespace Database\Seeders;

use App\Models\Plan;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
  public function run(): void
  {
    foreach ((array) config('plans', []) as $planConfig) {
      if (! is_array($planConfig) || ! isset($planConfig['slug'], $planConfig['name'])) {
        continue;
      }

      $plan = Plan::query()->firstOrNew(['slug' => (string) $planConfig['slug']]);
      $plan->fill([
        'name' => (string) $planConfig['name'],
        'amount' => (int) ($planConfig['amount'] ?? 0),
        'currency' => (string) ($planConfig['currency'] ?? config('billing.default_currency', 'usd')),
        'interval' => (string) ($planConfig['interval'] ?? 'month'),
        'features' => (array) ($planConfig['features'] ?? []),
        'limits' => (array) ($planConfig['limits'] ?? []),
        'is_active' => true,
      ]);
      $plan->stripe_product_id = $this->stripeId($planConfig['product_id'] ?? null) ?? $plan->stripe_product_id;
      $plan->stripe_price_id = $this->stripeId($planConfig['price_id'] ?? null) ?? $plan->stripe_price_id;
      $plan->save();
    }
  }

  /**
   * Blank environment values must become null, otherwise the unique index rejects the second plan.
   */
  private function stripeId(mixed $value): ?string
  {
    if (! is_string($value)) {
      return null;
    }

    $value = trim($value);

    return $value === '' ? null : $value;
  }
}
