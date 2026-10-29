<?php

namespace Tests\Feature;

use App\Models\BillingInvoice;
use App\Models\BillingPayment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\StripeGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class StripeSyncBillingCommandTest extends TestCase
{
  use RefreshDatabase;

  private Tenant $tenant;

  protected function setUp(): void
  {
    parent::setUp();

    $this->tenant = Tenant::factory()->create(['stripe_customer_id' => 'cus_123']);
    Plan::factory()->create(['stripe_price_id' => 'price_123']);

    config(['services.stripe.secret' => 'sk_test_fake']);
  }

  public function test_backfill_is_idempotent(): void
  {
    $gateway = Mockery::mock(StripeGateway::class);
    $gateway->shouldReceive('listSubscriptions')
      ->twice()
      ->with('cus_123', null)
      ->andReturn([$this->subscription()]);
    $gateway->shouldReceive('listInvoices')
      ->twice()
      ->with('cus_123', null)
      ->andReturn([$this->invoice('in_1'), $this->invoice('in_2')]);
    $gateway->shouldReceive('listCharges')
      ->twice()
      ->with('cus_123', null)
      ->andReturn([$this->charge('ch_1'), $this->charge('ch_2')]);

    $this->app->instance(StripeGateway::class, $gateway);

    $this->artisan('stripe:sync-billing --tenant='.$this->tenant->id)->assertExitCode(0);
    $this->artisan('stripe:sync-billing --tenant='.$this->tenant->id)->assertExitCode(0);

    $this->assertSame(1, Subscription::query()->where('tenant_id', $this->tenant->id)->count());
    $this->assertSame(2, BillingInvoice::query()->where('tenant_id', $this->tenant->id)->count());
    $this->assertSame(2, BillingPayment::query()->where('tenant_id', $this->tenant->id)->count());
  }

  public function test_backfill_passes_the_since_timestamp_to_stripe(): void
  {
    $gateway = Mockery::mock(StripeGateway::class);
    $gateway->shouldReceive('listSubscriptions')
      ->once()
      ->with('cus_123', 1700000000)
      ->andReturn([]);
    $gateway->shouldReceive('listInvoices')
      ->once()
      ->with('cus_123', 1700000000)
      ->andReturn([]);
    $gateway->shouldReceive('listCharges')
      ->once()
      ->with('cus_123', 1700000000)
      ->andReturn([]);

    $this->app->instance(StripeGateway::class, $gateway);

    $this->artisan('stripe:sync-billing --tenant='.$this->tenant->id.' --since=1700000000')
      ->assertExitCode(0);
  }

  /**
   * @return array<string, mixed>
   */
  private function subscription(): array
  {
    return [
      'id' => 'sub_123',
      'customer' => 'cus_123',
      'status' => 'active',
      'current_period_start' => now()->timestamp,
      'current_period_end' => now()->addMonth()->timestamp,
      'cancel_at_period_end' => false,
      'items' => ['data' => [['price' => ['id' => 'price_123']]]],
      'metadata' => ['tenant_id' => (string) $this->tenant->id],
    ];
  }

  /**
   * @return array<string, mixed>
   */
  private function invoice(string $id): array
  {
    return [
      'id' => $id,
      'customer' => 'cus_123',
      'subscription' => 'sub_123',
      'status' => 'paid',
      'currency' => 'usd',
      'subtotal' => 1900,
      'tax' => 0,
      'total' => 1900,
      'amount_paid' => 1900,
      'amount_due' => 0,
      'period_start' => now()->subMonth()->timestamp,
      'period_end' => now()->timestamp,
      'status_transitions' => ['paid_at' => now()->timestamp],
    ];
  }

  /**
   * @return array<string, mixed>
   */
  private function charge(string $id): array
  {
    return [
      'id' => $id,
      'customer' => 'cus_123',
      'invoice' => 'in_1',
      'payment_intent' => 'pi_'.$id,
      'amount' => 1900,
      'amount_refunded' => 0,
      'currency' => 'usd',
      'status' => 'succeeded',
      'created' => now()->timestamp,
    ];
  }
}
