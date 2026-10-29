<?php

namespace Database\Factories;

use App\Models\BillingPayment;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<BillingPayment> */
class BillingPaymentFactory extends Factory
{
  protected $model = BillingPayment::class;

  public function definition(): array
  {
    return [
      'tenant_id' => 1,
      'stripe_charge_id' => 'ch_'.Str::random(14),
      'stripe_payment_intent_id' => 'pi_'.Str::random(14),
      'stripe_invoice_id' => 'in_'.Str::random(14),
      'amount' => fake()->numberBetween(1000, 10000),
      'amount_refunded' => 0,
      'currency' => 'usd',
      'status' => 'succeeded',
      'paid_at' => now(),
    ];
  }

  public function forTenant(Tenant $tenant): static
  {
    return $this->state(fn (): array => ['tenant_id' => $tenant->id]);
  }

  public function failed(): static
  {
    return $this->state(fn (): array => [
      'status' => 'failed',
      'paid_at' => null,
    ]);
  }

  public function refunded(): static
  {
    return $this->state(fn (array $attributes): array => [
      'status' => 'refunded',
      'amount_refunded' => $attributes['amount'],
    ]);
  }

  public function disputed(): static
  {
    return $this->state(fn (): array => ['status' => 'disputed']);
  }
}
