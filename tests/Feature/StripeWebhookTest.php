<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\StripeWebhookEvent;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\StripeGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Mockery;
use Stripe\WebhookSignature;
use Tests\TestCase;

class StripeWebhookTest extends TestCase
{
  use RefreshDatabase;

  private Tenant $tenant;

  private Plan $plan;

  protected function setUp(): void
  {
    parent::setUp();

    $this->tenant = Tenant::factory()->create(['stripe_customer_id' => 'cus_tenant']);
    $this->plan = Plan::factory()->create([
      'stripe_price_id' => 'price_1',
      'amount' => 1900,
    ]);

    config([
      'services.stripe.secret' => 'sk_test_fake',
      'services.stripe.webhook_secret' => 'whsec_test',
    ]);
  }

  public function test_webhook_rejects_missing_or_invalid_signatures(): void
  {
    $this->postJson('/api/v1/stripe/webhook', [])->assertStatus(400);

    $payload = json_encode($this->event('evt_bad', 'customer.subscription.updated', $this->subscriptionObject()));
    $this->call('POST', '/api/v1/stripe/webhook', [], [], [], [
      'CONTENT_TYPE' => 'application/json',
      'HTTP_STRIPE_SIGNATURE' => 'invalid',
    ], (string) $payload)->assertStatus(400);
  }

  public function test_subscription_event_updates_the_local_mirror(): void
  {
    $this->webhook($this->event('evt_sub_updated', 'customer.subscription.updated', $this->subscriptionObject()))
      ->assertOk()
      ->assertJsonPath('processed', true);

    $this->assertDatabaseHas('subscriptions', [
      'tenant_id' => $this->tenant->id,
      'stripe_subscription_id' => 'sub_123',
      'stripe_customer_id' => 'cus_tenant',
      'plan_id' => $this->plan->id,
      'status' => 'active',
    ]);

    $this->assertFalse($this->tenant->fresh()->is_due);
  }

  public function test_subscription_event_reads_period_dates_from_items_when_needed(): void
  {
    $this->webhook($this->event('evt_sub_items_period', 'customer.subscription.updated', $this->subscriptionObject([
      'current_period_start' => null,
      'current_period_end' => null,
      'items' => [
        'data' => [[
          'price' => ['id' => 'price_1'],
          'current_period_start' => now()->timestamp,
          'current_period_end' => now()->addMonth()->timestamp,
        ]],
      ],
    ])))->assertOk();

    $subscription = Subscription::query()->where('tenant_id', $this->tenant->id)->firstOrFail();

    $this->assertNotNull($subscription->current_period_start);
    $this->assertNotNull($subscription->current_period_end);
  }

  public function test_past_due_subscription_flags_the_tenant_as_due(): void
  {
    $this->webhook($this->event('evt_sub_past_due', 'customer.subscription.updated', $this->subscriptionObject([
      'status' => 'past_due',
    ])))->assertOk();

    $this->assertTrue($this->tenant->fresh()->is_due);
  }

  public function test_checkout_completed_retrieves_and_syncs_the_subscription(): void
  {
    $gateway = Mockery::mock(StripeGateway::class);
    $gateway->shouldReceive('retrieveSubscription')
      ->once()
      ->with('sub_123')
      ->andReturn($this->subscriptionObject());

    $this->app->instance(StripeGateway::class, $gateway);

    $this->webhook($this->event('evt_checkout', 'checkout.session.completed', [
      'id' => 'cs_123',
      'customer' => 'cus_tenant',
      'subscription' => 'sub_123',
      'metadata' => ['tenant_id' => (string) $this->tenant->id],
    ]))->assertOk()->assertJsonPath('processed', true);

    $this->assertDatabaseHas('subscriptions', [
      'tenant_id' => $this->tenant->id,
      'stripe_subscription_id' => 'sub_123',
      'status' => 'active',
    ]);
  }

  public function test_duplicate_event_is_idempotent(): void
  {
    $event = $this->event('evt_duplicate', 'customer.subscription.updated', $this->subscriptionObject());

    $this->webhook($event)
      ->assertOk()
      ->assertJsonPath('duplicate', false)
      ->assertJsonPath('processed', true);

    $this->webhook($event)
      ->assertOk()
      ->assertJsonPath('duplicate', true)
      ->assertJsonPath('processed', false);

    $this->assertSame(1, StripeWebhookEvent::query()->where('stripe_event_id', 'evt_duplicate')->count());
  }

  public function test_invoice_event_populates_the_invoice_mirror_and_clears_due(): void
  {
    $this->tenant->forceFill(['is_due' => true])->save();

    Subscription::factory()->forTenant($this->tenant)->forPlan($this->plan)->create([
      'stripe_subscription_id' => 'sub_123',
      'stripe_customer_id' => 'cus_tenant',
    ]);

    $gateway = Mockery::mock(StripeGateway::class);
    $gateway->shouldReceive('retrieveSubscription')
      ->once()
      ->with('sub_123')
      ->andReturn($this->subscriptionObject());

    $this->app->instance(StripeGateway::class, $gateway);

    $invoice = $this->invoiceObject();

    $this->webhook($this->event('evt_invoice_paid', 'invoice.paid', $invoice))
      ->assertOk()
      ->assertJsonPath('processed', true);

    $this->assertDatabaseHas('billing_invoices', [
      'tenant_id' => $this->tenant->id,
      'stripe_invoice_id' => 'in_123',
      'stripe_subscription_id' => 'sub_123',
      'status' => 'paid',
      'total' => 1900,
      'amount_paid' => 1900,
    ]);

    $this->assertFalse($this->tenant->fresh()->is_due);
  }

  public function test_invoice_paid_reads_the_new_parent_subscription_shape_and_amount_remaining(): void
  {
    Subscription::factory()->forTenant($this->tenant)->forPlan($this->plan)->create([
      'stripe_subscription_id' => 'sub_123',
      'stripe_customer_id' => 'cus_tenant',
    ]);

    $gateway = Mockery::mock(StripeGateway::class);
    $gateway->shouldReceive('retrieveSubscription')
      ->once()
      ->with('sub_123')
      ->andReturn($this->subscriptionObject());

    $this->app->instance(StripeGateway::class, $gateway);

    $invoice = $this->invoiceObject([
      'subscription' => null,
      'parent' => [
        'subscription_details' => [
          'subscription' => 'sub_123',
          'metadata' => ['tenant_id' => (string) $this->tenant->id, 'plan_id' => (string) $this->plan->id],
        ],
      ],
      'amount_paid' => 1900,
      'amount_remaining' => 0,
      'amount_due' => 1900,
    ]);

    $this->webhook($this->event('evt_invoice_parent', 'invoice.paid', $invoice))->assertOk();

    $this->assertDatabaseHas('billing_invoices', [
      'stripe_invoice_id' => 'in_123',
      'stripe_subscription_id' => 'sub_123',
      'amount_paid' => 1900,
      'amount_due' => 0,
    ]);
  }

  public function test_payment_intent_succeeded_mirrors_the_latest_charge(): void
  {
    $gateway = Mockery::mock(StripeGateway::class);
    $gateway->shouldReceive('retrieveCharge')
      ->once()
      ->with('ch_123')
      ->andReturn($this->chargeObject());

    $this->app->instance(StripeGateway::class, $gateway);

    $this->webhook($this->event('evt_payment_intent', 'payment_intent.succeeded', [
      'id' => 'pi_123',
      'customer' => 'cus_tenant',
      'latest_charge' => 'ch_123',
      'amount' => 1900,
      'currency' => 'usd',
      'status' => 'succeeded',
    ]))->assertOk();

    $this->assertDatabaseHas('billing_payments', [
      'tenant_id' => $this->tenant->id,
      'stripe_charge_id' => 'ch_123',
      'stripe_payment_intent_id' => 'pi_123',
      'amount' => 1900,
      'status' => 'succeeded',
    ]);
  }

  public function test_charge_events_populate_refund_and_dispute_state(): void
  {
    Subscription::factory()->forTenant($this->tenant)->forPlan($this->plan)->create([
      'stripe_subscription_id' => 'sub_123',
      'stripe_customer_id' => 'cus_tenant',
    ]);

    $charge = $this->chargeObject();

    $this->webhook($this->event('evt_charge_succeeded', 'charge.succeeded', $charge))
      ->assertOk();

    $this->assertDatabaseHas('billing_payments', [
      'tenant_id' => $this->tenant->id,
      'stripe_charge_id' => 'ch_123',
      'status' => 'succeeded',
      'amount' => 1900,
    ]);

    $refunded = array_merge($charge, ['amount_refunded' => 1900]);

    $this->webhook($this->event('evt_charge_refunded', 'charge.refunded', $refunded))
      ->assertOk();

    $this->assertDatabaseHas('billing_payments', [
      'stripe_charge_id' => 'ch_123',
      'status' => 'refunded',
      'amount_refunded' => 1900,
    ]);

    $this->webhook($this->event('evt_dispute', 'charge.dispute.created', [
      'id' => 'dp_123',
      'charge' => 'ch_123',
      'amount' => 1900,
      'status' => 'needs_response',
    ]))->assertOk();

    $this->assertDatabaseHas('billing_payments', [
      'stripe_charge_id' => 'ch_123',
      'status' => 'disputed',
    ]);
  }

  public function test_invoice_payment_failed_marks_the_subscription_past_due(): void
  {
    Subscription::factory()->forTenant($this->tenant)->forPlan($this->plan)->create([
      'stripe_subscription_id' => 'sub_123',
      'stripe_customer_id' => 'cus_tenant',
      'status' => 'active',
    ]);

    $gateway = Mockery::mock(StripeGateway::class);
    $gateway->shouldReceive('retrieveSubscription')
      ->once()
      ->with('sub_123')
      ->andReturn($this->subscriptionObject(['status' => 'past_due']));

    $this->app->instance(StripeGateway::class, $gateway);

    $this->webhook($this->event('evt_invoice_failed', 'invoice.payment_failed', $this->invoiceObject([
      'status' => 'open',
      'paid' => false,
      'amount_paid' => 0,
      'amount_due' => 1900,
      'status_transitions' => ['paid_at' => null],
    ])))->assertOk();

    $this->assertDatabaseHas('subscriptions', [
      'tenant_id' => $this->tenant->id,
      'status' => 'past_due',
    ]);

    $this->assertDatabaseHas('billing_invoices', [
      'stripe_invoice_id' => 'in_123',
      'status' => 'open',
    ]);

    $this->assertTrue($this->tenant->fresh()->is_due);
  }

  public function test_unknown_events_are_noops_but_are_recorded(): void
  {
    $this->webhook($this->event('evt_unknown', 'some.unknown.event', ['id' => 'obj_123']))
      ->assertOk()
      ->assertJsonPath('processed', true);

    $record = StripeWebhookEvent::query()->where('stripe_event_id', 'evt_unknown')->firstOrFail();

    $this->assertNotNull($record->processed_at);
  }

  private function webhook(array $event, ?string $secret = null): TestResponse
  {
    $payload = json_encode($event, JSON_THROW_ON_ERROR);
    $signature = WebhookSignature::generateSignatureHeader(
      $payload,
      $secret ?? (string) config('services.stripe.webhook_secret'),
    );

    return $this->call('POST', '/api/v1/stripe/webhook', [], [], [], [
      'CONTENT_TYPE' => 'application/json',
      'HTTP_STRIPE_SIGNATURE' => $signature,
    ], $payload);
  }

  /**
   * @return array<string, mixed>
   */
  private function event(string $id, string $type, array $object): array
  {
    return [
      'id' => $id,
      'object' => 'event',
      'type' => $type,
      'data' => ['object' => $object],
    ];
  }

  /**
   * @param  array<string, mixed>  $overrides
   * @return array<string, mixed>
   */
  private function subscriptionObject(array $overrides = []): array
  {
    return array_merge([
      'id' => 'sub_123',
      'customer' => 'cus_tenant',
      'status' => 'active',
      'current_period_start' => now()->timestamp,
      'current_period_end' => now()->addMonth()->timestamp,
      'trial_end' => null,
      'cancel_at_period_end' => false,
      'items' => ['data' => [['price' => ['id' => 'price_1']]]],
      'metadata' => ['tenant_id' => (string) $this->tenant->id],
    ], $overrides);
  }

  /**
   * @param  array<string, mixed>  $overrides
   * @return array<string, mixed>
   */
  private function invoiceObject(array $overrides = []): array
  {
    return array_merge([
      'id' => 'in_123',
      'customer' => 'cus_tenant',
      'subscription' => 'sub_123',
      'status' => 'paid',
      'currency' => 'usd',
      'subtotal' => 1900,
      'tax' => 0,
      'total' => 1900,
      'amount_paid' => 1900,
      'amount_due' => 0,
      'hosted_invoice_url' => 'https://invoice.stripe.test/in_123',
      'invoice_pdf' => 'https://invoice.stripe.test/in_123.pdf',
      'period_start' => now()->subMonth()->timestamp,
      'period_end' => now()->timestamp,
      'status_transitions' => ['paid_at' => now()->timestamp],
    ], $overrides);
  }

  /**
   * @return array<string, mixed>
   */
  private function chargeObject(): array
  {
    return [
      'id' => 'ch_123',
      'customer' => 'cus_tenant',
      'invoice' => 'in_123',
      'payment_intent' => 'pi_123',
      'amount' => 1900,
      'amount_refunded' => 0,
      'currency' => 'usd',
      'status' => 'succeeded',
      'created' => now()->timestamp,
    ];
  }
}
