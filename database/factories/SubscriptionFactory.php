<?php

namespace Database\Factories;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Subscription> */
class SubscriptionFactory extends Factory
{
  protected $model = Subscription::class;

  public function definition(): array
  {
    return [
      'tenant_id' => 1,
      'plan_id' => null,
      'stripe_customer_id' => 'cus_'.Str::random(14),
      'stripe_subscription_id' => 'sub_'.Str::random(14),
      'status' => 'active',
      'current_period_start' => now()->subMonth(),
      'current_period_end' => now()->addMonth(),
      'trial_ends_at' => null,
      'cancel_at_period_end' => false,
    ];
  }

  public function forTenant(Tenant $tenant): static
  {
    return $this->state(fn (): array => ['tenant_id' => $tenant->id]);
  }

  public function forPlan(Plan $plan): static
  {
    return $this->state(fn (): array => ['plan_id' => $plan->id]);
  }

  public function active(): static
  {
    return $this->state(fn (): array => ['status' => 'active']);
  }

  public function trialing(): static
  {
    return $this->state(fn (): array => [
      'status' => 'trialing',
      'trial_ends_at' => now()->addDays(14),
    ]);
  }

  public function canceled(): static
  {
    return $this->state(fn (): array => ['status' => 'canceled']);
  }
}
