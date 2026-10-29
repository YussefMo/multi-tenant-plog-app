<?php

namespace Database\Factories;

use App\Models\BillingInvoice;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<BillingInvoice> */
class BillingInvoiceFactory extends Factory
{
  protected $model = BillingInvoice::class;

  public function definition(): array
  {
    $amount = fake()->numberBetween(1000, 10000);

    return [
      'tenant_id' => 1,
      'stripe_invoice_id' => 'in_'.Str::random(14),
      'stripe_customer_id' => 'cus_'.Str::random(14),
      'stripe_subscription_id' => 'sub_'.Str::random(14),
      'status' => 'paid',
      'currency' => 'usd',
      'subtotal' => $amount,
      'tax' => 0,
      'total' => $amount,
      'amount_paid' => $amount,
      'amount_due' => 0,
      'hosted_invoice_url' => 'https://invoice.stripe.test/'.Str::random(10),
      'invoice_pdf' => 'https://invoice.stripe.test/'.Str::random(10).'.pdf',
      'period_start' => now()->subMonth(),
      'period_end' => now(),
      'paid_at' => now(),
    ];
  }

  public function forTenant(Tenant $tenant): static
  {
    return $this->state(fn (): array => ['tenant_id' => $tenant->id]);
  }

  public function failed(): static
  {
    return $this->state(fn (array $attributes): array => [
      'status' => 'open',
      'amount_paid' => 0,
      'amount_due' => $attributes['total'],
      'paid_at' => null,
    ]);
  }
}
