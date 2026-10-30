<?php

namespace Tests\Feature;

use App\Models\Owner;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Services\StripeGateway;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use RuntimeException;
use Tests\TestCase;

class PlanManagementTest extends TestCase
{
  use RefreshDatabase;

  private Owner $owner;

  protected function setUp(): void
  {
    parent::setUp();

    $this->refreshOwnerDatabase();
    $this->owner = Owner::factory()->create();
  }

  public function test_owner_can_create_update_and_delete_a_plan(): void
  {
    $response = $this->actingAs($this->owner, 'owner')
      ->postJson('/api/v1/owner/plans', [
        'name' => 'Starter Plan',
        'amount' => 1900,
        'currency' => 'usd',
        'interval' => 'month',
        'features' => ['published_posts'],
        'limits' => ['max_users' => 5, 'max_posts' => 50],
      ])
      ->assertCreated()
      ->assertJsonPath('data.name', 'Starter Plan')
      ->assertJsonPath('data.slug', 'starter-plan')
      ->assertJsonPath('data.amount', 1900)
      ->assertJsonPath('data.limits.max_users', 5);

    $planId = $response->json('data.id');

    $this->assertDatabaseHas('plans', [
      'id' => $planId,
      'slug' => 'starter-plan',
      'is_active' => true,
    ]);

    $this->actingAs($this->owner, 'owner')
      ->patchJson("/api/v1/owner/plans/{$planId}", [
        'name' => 'Starter Plus',
        'amount' => 2900,
      ])
      ->assertOk()
      ->assertJsonPath('data.name', 'Starter Plus')
      ->assertJsonPath('data.amount', 2900);

    $this->actingAs($this->owner, 'owner')
      ->deleteJson("/api/v1/owner/plans/{$planId}")
      ->assertNoContent();

    $this->assertDatabaseMissing('plans', ['id' => $planId]);
  }

  public function test_plan_with_subscriptions_cannot_be_deleted(): void
  {
    $tenant = Tenant::factory()->create();
    $plan = Plan::factory()->create();
    Subscription::factory()->forTenant($tenant)->forPlan($plan)->create();

    $this->actingAs($this->owner, 'owner')
      ->deleteJson("/api/v1/owner/plans/{$plan->id}")
      ->assertStatus(409);
  }

  public function test_plan_seeder_creates_configured_plans(): void
  {
    config(['plans' => [
      'plan_1' => [
        'name' => 'Starter',
        'slug' => 'starter',
        'product_id' => 'prod_1',
        'price_id' => 'price_1',
        'amount' => 1000,
        'currency' => 'usd',
        'interval' => 'month',
        'features' => ['posts'],
        'limits' => ['max_users' => 5],
      ],
    ]]);

    $this->seed(PlanSeeder::class);

    $this->assertDatabaseHas('plans', [
      'slug' => 'starter',
      'stripe_product_id' => 'prod_1',
      'stripe_price_id' => 'price_1',
      'amount' => 1000,
    ]);
  }

  public function test_sync_plans_creates_missing_products_and_prices_idempotently(): void
  {
    config(['plans' => [
      'plan_1' => [
        'name' => 'Starter',
        'slug' => 'starter',
        'product_id' => null,
        'price_id' => null,
        'amount' => 1900,
        'currency' => 'usd',
        'interval' => 'month',
        'features' => [],
        'limits' => [],
      ],
    ]]);

    $gateway = Mockery::mock(StripeGateway::class);
    $gateway->shouldReceive('createProduct')
      ->once()
      ->with('Starter', Mockery::on(fn (array $metadata): bool => isset($metadata['plan_id'])))
      ->andReturn('prod_new');
    $gateway->shouldReceive('createPrice')
      ->once()
      ->with('prod_new', 1900, 'usd', 'month')
      ->andReturn([
        'id' => 'price_new',
        'unit_amount' => 1900,
        'currency' => 'usd',
        'recurring' => ['interval' => 'month'],
      ]);
    $gateway->shouldReceive('retrievePrice')
      ->once()
      ->with('price_new')
      ->andReturn([
        'id' => 'price_new',
        'unit_amount' => 1900,
        'currency' => 'usd',
        'recurring' => ['interval' => 'month'],
      ]);

    $this->app->instance(StripeGateway::class, $gateway);

    $this->artisan('stripe:sync-plans')->assertExitCode(0);
    $this->artisan('stripe:sync-plans')->assertExitCode(0);

    $this->assertDatabaseHas('plans', [
      'slug' => 'starter',
      'stripe_product_id' => 'prod_new',
      'stripe_price_id' => 'price_new',
    ]);
  }

  public function test_live_stripe_keys_are_rejected_unless_allowed(): void
  {
    config([
      'services.stripe.secret' => 'sk_live_example',
      'services.stripe.allow_live' => false,
    ]);

    $this->expectException(RuntimeException::class);

    StripeGateway::assertSafeConfiguration();
  }

  public function test_live_stripe_mode_is_rejected_unless_allowed(): void
  {
    config([
      'services.stripe.secret' => 'sk_test_example',
      'services.stripe.mode' => 'live',
      'services.stripe.allow_live' => false,
    ]);

    $this->expectException(RuntimeException::class);

    StripeGateway::assertSafeConfiguration();
  }

  public function test_updating_a_plan_with_an_empty_slug_keeps_the_existing_slug(): void
  {
    $plan = Plan::factory()->create(['slug' => 'starter']);

    $this->actingAs($this->owner, 'owner')
      ->patchJson("/api/v1/owner/plans/{$plan->id}", [
        'name' => 'Starter Renamed',
        'slug' => null,
      ])
      ->assertOk()
      ->assertJsonPath('data.name', 'Starter Renamed')
      ->assertJsonPath('data.slug', 'starter');
  }

  public function test_plans_include_subscription_counts(): void
  {
    $plan = Plan::factory()->create();
    $otherPlan = Plan::factory()->create();

    Subscription::factory()->forTenant(Tenant::factory()->create())->forPlan($plan)->active()->create();
    Subscription::factory()->forTenant(Tenant::factory()->create())->forPlan($plan)->canceled()->create();

    $this->actingAs($this->owner, 'owner')
      ->getJson('/api/v1/owner/plans')
      ->assertOk()
      ->assertJsonFragment([
        'id' => $plan->id,
        'subscriptions_count' => 2,
        'active_subscriptions_count' => 1,
      ])
      ->assertJsonFragment([
        'id' => $otherPlan->id,
        'subscriptions_count' => 0,
        'active_subscriptions_count' => 0,
      ]);

    $this->actingAs($this->owner, 'owner')
      ->getJson("/api/v1/owner/plans/{$plan->id}")
      ->assertOk()
      ->assertJsonPath('data.subscriptions_count', 2)
      ->assertJsonPath('data.active_subscriptions_count', 1);
  }
}
