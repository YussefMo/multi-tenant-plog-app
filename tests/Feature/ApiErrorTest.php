<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApiErrorTest extends TestCase
{
  use RefreshDatabase;

  public function test_unauthenticated_errors_have_a_standard_envelope(): void
  {
    $this->getJson('/api/v1/user')
      ->assertUnauthorized()
      ->assertJson([
        'message' => 'Unauthenticated.',
        'status' => 401,
      ]);
  }

  public function test_forbidden_errors_have_a_standard_envelope(): void
  {
    $tenant = Tenant::factory()->create();
    $author = User::factory()->forTenant($tenant)->author()->create();

    $this->actingAs($author)
      ->getJson('/api/v1/users')
      ->assertForbidden()
      ->assertJsonPath('status', 403)
      ->assertJsonStructure(['message', 'status']);
  }

  public function test_not_found_errors_have_a_standard_envelope(): void
  {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->forTenant($tenant)->admin()->create();

    $this->actingAs($admin)
      ->getJson('/api/v1/users/999999')
      ->assertNotFound()
      ->assertJsonPath('status', 404)
      ->assertJsonStructure(['message', 'status']);
  }

  public function test_conflict_errors_have_a_standard_envelope(): void
  {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->forTenant($tenant)->admin()->create();
    $plan = Plan::factory()->create(['stripe_price_id' => 'price_123']);

    Subscription::factory()->forTenant($tenant)->forPlan($plan)->create([
      'status' => 'active',
      'stripe_subscription_id' => 'sub_existing',
    ]);

    $this->actingAs($admin)
      ->postJson('/api/v1/billing/checkout', ['plan_id' => $plan->id])
      ->assertStatus(409)
      ->assertJsonPath('status', 409)
      ->assertJsonStructure(['message', 'status']);
  }

  public function test_validation_errors_have_a_standard_envelope(): void
  {
    $this->postJson('/api/v1/auth/register', [])
      ->assertStatus(422)
      ->assertJsonPath('status', 422)
      ->assertJsonStructure(['message', 'status', 'errors']);
  }

  public function test_419_errors_have_a_standard_envelope(): void
  {
    Route::get('/api/v1/test-419', fn () => abort(419, 'CSRF token mismatch.'));

    $this->getJson('/api/v1/test-419')
      ->assertStatus(419)
      ->assertJson([
        'message' => 'CSRF token mismatch.',
        'status' => 419,
      ]);
  }
}
