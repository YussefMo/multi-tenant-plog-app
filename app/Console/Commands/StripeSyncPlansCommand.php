<?php

namespace App\Console\Commands;

use App\Models\Plan;
use App\Services\StripeGateway;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('stripe:sync-plans')]
#[Description('Create or update Stripe products and prices for the configured plans')]
class StripeSyncPlansCommand extends Command
{
  public function handle(StripeGateway $stripe): int
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
      $plan->stripe_product_id = $planConfig['product_id'] ?? $plan->stripe_product_id;
      $plan->stripe_price_id = $planConfig['price_id'] ?? $plan->stripe_price_id;
      $plan->save();

      if ($plan->stripe_price_id !== null) {
        $price = $stripe->retrievePrice($plan->stripe_price_id);
        $plan->stripe_product_id = (string) data_get($price, 'product', $plan->stripe_product_id);
      } else {
        if ($plan->stripe_product_id === null) {
          $plan->stripe_product_id = $stripe->createProduct($plan->name, [
            'plan_id' => (string) $plan->id,
          ]);
        }

        $price = $stripe->createPrice($plan->stripe_product_id, $plan->amount, $plan->currency, $plan->interval);
      }

      $plan->stripe_price_id = (string) data_get($price, 'id', $plan->stripe_price_id);
      $plan->amount = (int) data_get($price, 'unit_amount', $plan->amount);
      $plan->currency = (string) data_get($price, 'currency', $plan->currency);
      $plan->interval = (string) data_get($price, 'recurring.interval', $plan->interval);
      $plan->save();

      $this->info("Synced {$plan->name} ({$plan->stripe_price_id}).");
    }

    return self::SUCCESS;
  }
}
