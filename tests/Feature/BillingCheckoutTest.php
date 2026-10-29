<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use App\Services\StripeGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class BillingCheckoutTest extends TestCase
{
  use RefreshDatabase;

  private Tenant $tenant;

  private User $admin;

  protected function setUp(): void
  {
    parent::setUp();

    $this->tenant = Tenant::factory()->create();
    $this->admin = User::factory()->forTenant($this->tenant)->admin()->create();

    config([
      'billing.public_url' => 'https://ngrok.test',
      'services.stripe.secret' => 'sk_test_fake',
      'services.stripe.webhook_secret' => 'whsec_test',
    ]);
  }

  public function test_tenant_can_list_active_plans_and_has_no_subscription(): void
  {
    $active = Plan::factory()->create(['name' => 'Active', 'amount' => 1000]);
    Plan::factory()->inactive()->create(['name' => 'Inactive']);

    $this->actingAs($this->admin)
      ->getJson('/api/v1/billing/plans')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.id', $active->id);

    $this->actingAs($this->admin)
      ->getJson('/api/v1/billing/subscription')
      ->assertOk()
      ->assertJsonPath('data', null);
  }

  public function test_checkout_returns_hosted_stripe_url_and_creates_customer(): void
  {
    $plan = Plan::factory()->create([
      'stripe_price_id' => 'price_123',
      'amount' => 1900,
    ]);

    $gateway = Mockery::mock(StripeGateway::class);
    $gateway->shouldReceive('createCustomer')
      ->once()
      ->with($this->tenant->name, ['tenant_id' => (string) $this->tenant->id])
      ->andReturn('cus_123');
    $gateway->shouldReceive('createCheckoutSession')
      ->once()
      ->with(Mockery::on(function (array $params) use ($plan): bool {
        return $params['mode'] === 'subscription'
          && $params['customer'] === 'cus_123'
          && $params['line_items'][0]['price'] === 'price_123'
          && $params['success_url'] === 'https://ngrok.test/api/v1/billing/checkout/success?session_id={CHECKOUT_SESSION_ID}'
          && $params['cancel_url'] === 'https://ngrok.test/api/v1/billing/checkout/cancel'
          && $params['metadata']['tenant_id'] === (string) $this->tenant->id
          && $params['metadata']['plan_id'] === (string) $plan->id
          && str_starts_with($params['integration_identifier'], 'checkout_')
          && ! isset($params['payment_method_types']);
      }))
      ->andReturn([
        'id' => 'cs_123',
        'url' => 'https://checkout.stripe.test/c/cs_123',
      ]);

    $this->app->instance(StripeGateway::class, $gateway);

    $this->actingAs($this->admin)
      ->postJson('/api/v1/billing/checkout', ['plan_id' => $plan->id])
      ->assertCreated()
      ->assertJsonPath('checkout_url', 'https://checkout.stripe.test/c/cs_123')
      ->assertJsonPath('session_id', 'cs_123');

    $this->assertSame('cus_123', $this->tenant->fresh()->stripe_customer_id);
    $this->assertDatabaseMissing('subscriptions', ['tenant_id' => $this->tenant->id]);
  }

  public function test_checkout_requires_a_stripe_price(): void
  {
    $plan = Plan::factory()->create(['stripe_price_id' => null]);

    $this->actingAs($this->admin)
      ->postJson('/api/v1/billing/checkout', ['plan_id' => $plan->id])
      ->assertStatus(422);
  }

  public function test_checkout_rejects_a_tenant_that_already_has_a_subscription(): void
  {
    $plan = Plan::factory()->create(['stripe_price_id' => 'price_123']);
    Subscription::factory()->forTenant($this->tenant)->forPlan($plan)->create([
      'status' => 'active',
      'stripe_subscription_id' => 'sub_existing',
      'stripe_customer_id' => 'cus_existing',
    ]);

    $this->actingAs($this->admin)
      ->postJson('/api/v1/billing/checkout', ['plan_id' => $plan->id])
      ->assertStatus(409);
  }

  public function test_tenant_can_open_the_billing_portal(): void
  {
    $this->tenant->forceFill(['stripe_customer_id' => 'cus_123'])->save();

    $gateway = Mockery::mock(StripeGateway::class);
    $gateway->shouldReceive('createPortalSession')
      ->once()
      ->with('cus_123', 'https://ngrok.test/api/v1/billing/portal/return')
      ->andReturn('https://billing.stripe.test/p/session');

    $this->app->instance(StripeGateway::class, $gateway);

    $this->actingAs($this->admin)
      ->postJson('/api/v1/billing/portal')
      ->assertOk()
      ->assertJsonPath('portal_url', 'https://billing.stripe.test/p/session');
  }

  public function test_tenant_can_cancel_at_period_end(): void
  {
    $plan = Plan::factory()->create(['stripe_price_id' => 'price_123']);
    Subscription::factory()->forTenant($this->tenant)->forPlan($plan)->create([
      'status' => 'active',
      'stripe_subscription_id' => 'sub_123',
      'stripe_customer_id' => 'cus_123',
      'cancel_at_period_end' => false,
    ]);

    $gateway = Mockery::mock(StripeGateway::class);
    $gateway->shouldReceive('cancelSubscriptionAtPeriodEnd')
      ->once()
      ->with('sub_123')
      ->andReturn([
        'id' => 'sub_123',
        'customer' => 'cus_123',
        'status' => 'active',
        'current_period_start' => now()->timestamp,
        'current_period_end' => now()->addMonth()->timestamp,
        'cancel_at_period_end' => true,
        'items' => ['data' => [['price' => ['id' => 'price_123']]]],
      ]);

    $this->app->instance(StripeGateway::class, $gateway);

    $this->actingAs($this->admin)
      ->postJson('/api/v1/billing/cancel')
      ->assertOk()
      ->assertJsonPath('data.cancel_at_period_end', true);

    $subscription = Subscription::query()->where('tenant_id', $this->tenant->id)->firstOrFail();

    $this->assertTrue($subscription->cancel_at_period_end);
  }

  public function test_billing_return_urls_redirect_to_the_tenant_frontend(): void
  {
    $this->get('/api/v1/billing/checkout/success')
      ->assertRedirect('http://tenant.multi-tenant-plog.test/billing?status=success');

    $this->get('/api/v1/billing/checkout/cancel')
      ->assertRedirect('http://tenant.multi-tenant-plog.test/billing?status=cancelled');

    $this->get('/api/v1/billing/portal/return')
      ->assertRedirect('http://tenant.multi-tenant-plog.test/billing?status=portal');
  }

  public function test_author_cannot_access_billing(): void
  {
    $author = User::factory()->forTenant($this->tenant)->author()->create();

    $this->actingAs($author)
      ->getJson('/api/v1/billing/plans')
      ->assertForbidden();

    $this->actingAs($author)
      ->postJson('/api/v1/billing/checkout', ['plan_id' => 1])
      ->assertForbidden();
  }
}
