<?php

namespace Tests\Feature;

use App\Models\BillingPayment;
use App\Models\Owner;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillingMetricsTest extends TestCase
{
  use RefreshDatabase;

  public function test_owner_can_view_billing_metrics(): void
  {
    $this->refreshOwnerDatabase();
    $owner = Owner::factory()->create();

    $monthly = Plan::factory()->create(['name' => 'Monthly', 'amount' => 1900, 'interval' => 'month']);
    $yearly = Plan::factory()->create(['name' => 'Yearly', 'amount' => 12000, 'interval' => 'year']);

    $activeTenant = Tenant::factory()->create();
    $trialingTenant = Tenant::factory()->create();
    $pastDueTenant = Tenant::factory()->create();
    $canceledTenant = Tenant::factory()->create();

    Subscription::factory()->forTenant($activeTenant)->forPlan($monthly)->active()->create();
    Subscription::factory()->forTenant($trialingTenant)->forPlan($yearly)->trialing()->create();
    Subscription::factory()->forTenant($pastDueTenant)->forPlan($monthly)->create(['status' => 'past_due']);
    Subscription::factory()->forTenant($canceledTenant)->forPlan($monthly)->canceled()->create();

    BillingPayment::factory()->forTenant($activeTenant)->create([
      'stripe_charge_id' => 'ch_active',
      'amount' => 1900,
      'amount_refunded' => 0,
      'status' => 'succeeded',
      'paid_at' => now(),
    ]);
    BillingPayment::factory()->forTenant($trialingTenant)->create([
      'stripe_charge_id' => 'ch_trialing',
      'amount' => 1900,
      'amount_refunded' => 200,
      'status' => 'partially_refunded',
      'paid_at' => now(),
    ]);
    BillingPayment::factory()->forTenant($pastDueTenant)->create([
      'stripe_charge_id' => 'ch_disputed',
      'amount' => 1900,
      'amount_refunded' => 0,
      'status' => 'disputed',
      'paid_at' => now(),
    ]);
    BillingPayment::factory()->forTenant($activeTenant)->create([
      'stripe_charge_id' => 'ch_failed',
      'amount' => 500,
      'amount_refunded' => 0,
      'status' => 'failed',
      'paid_at' => now(),
    ]);
    BillingPayment::factory()->forTenant($canceledTenant)->create([
      'stripe_charge_id' => 'ch_old',
      'amount' => 1000,
      'amount_refunded' => 0,
      'status' => 'succeeded',
      'paid_at' => now()->subDays(400),
    ]);

    $response = $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/billing/metrics')
      ->assertOk()
      ->assertJsonPath('data.mrr', 2900)
      ->assertJsonPath('data.arr', 34800)
      ->assertJsonPath('data.subscriptions.active', 1)
      ->assertJsonPath('data.subscriptions.trialing', 1)
      ->assertJsonPath('data.subscriptions.past_due', 1)
      ->assertJsonPath('data.subscriptions.canceled', 1)
      ->assertJsonPath('data.subscriptions.total', 4)
      ->assertJsonPath('data.revenue.gross', 3800)
      ->assertJsonPath('data.revenue.refunds', 200)
      ->assertJsonPath('data.revenue.net', 3600)
      ->assertJsonPath('data.failed_payments', 1)
      ->assertJsonPath('data.disputes', 1)
      ->assertJsonPath('data.churn_rate', 25);

    $this->assertCount(2, $response->json('data.plan_distribution'));
    $this->assertGreaterThanOrEqual(2, count($response->json('data.revenue_by_tenant')));
    $this->assertCount(12, $response->json('data.timeline'));
    $this->assertSame(3800, collect($response->json('data.timeline'))->sum('gross'));
    $this->assertSame(1, $response->json('data.payment_status_counts.succeeded'));
    $this->assertSame(1, $response->json('data.payment_status_counts.partially_refunded'));
    $this->assertSame(1, $response->json('data.payment_status_counts.disputed'));
    $this->assertSame(1, $response->json('data.payment_status_counts.failed'));
  }

  public function test_metrics_respect_the_date_range(): void
  {
    $this->refreshOwnerDatabase();
    $owner = Owner::factory()->create();

    $tenant = Tenant::factory()->create();
    $plan = Plan::factory()->create(['amount' => 1000, 'interval' => 'month']);
    Subscription::factory()->forTenant($tenant)->forPlan($plan)->active()->create();

    BillingPayment::factory()->forTenant($tenant)->create([
      'stripe_charge_id' => 'ch_in_range',
      'amount' => 1000,
      'status' => 'succeeded',
      'paid_at' => now(),
    ]);
    BillingPayment::factory()->forTenant($tenant)->create([
      'stripe_charge_id' => 'ch_out_of_range',
      'amount' => 5000,
      'status' => 'succeeded',
      'paid_at' => now()->subDays(30),
    ]);

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/billing/metrics?from='.now()->subDays(2)->toDateString())
      ->assertOk()
      ->assertJsonPath('data.revenue.gross', 1000);
  }
}
