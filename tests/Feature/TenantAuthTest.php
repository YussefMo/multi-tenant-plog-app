<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class TenantAuthTest extends TestCase
{
  use RefreshDatabase;

  protected function setUp(): void
  {
    parent::setUp();

    RateLimiter::clear('tenant-login|admin@example.com|127.0.0.1');
  }

  public function test_tenant_user_can_login_and_receives_tenant_context(): void
  {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->forTenant($tenant)->admin()->create([
      'email' => 'admin@example.com',
      'password' => 'password123',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
      'email' => 'admin@example.com',
      'password' => 'password123',
    ])
      ->assertOk()
      ->assertJsonPath('data.email', 'admin@example.com')
      ->assertJsonPath('data.role', 'admin')
      ->assertJsonPath('data.tenant.id', $tenant->id)
      ->assertJsonStructure(['data', 'csrf_token', 'redirect_url']);

    $this->assertStringContainsString($tenant->slug.'.tenant.', $response->json('redirect_url'));
    $this->assertAuthenticatedAs($admin, 'web');
  }

  public function test_viewer_login_redirects_to_user_frontend(): void
  {
    $tenant = Tenant::factory()->create();
    User::factory()->forTenant($tenant)->create([
      'email' => 'viewer@example.com',
      'password' => 'password123',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
      'email' => 'viewer@example.com',
      'password' => 'password123',
    ])
      ->assertOk()
      ->assertJsonPath('data.role', 'user');

    $this->assertStringContainsString($tenant->slug.'.user.', $response->json('redirect_url'));
  }

  public function test_invalid_credentials_are_rejected(): void
  {
    $tenant = Tenant::factory()->create();
    User::factory()->forTenant($tenant)->admin()->create([
      'email' => 'admin@example.com',
      'password' => 'password123',
    ]);

    $this->postJson('/api/v1/auth/login', [
      'email' => 'admin@example.com',
      'password' => 'wrong-password',
    ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('email');

    $this->assertGuest('web');
  }

  public function test_support_user_cannot_login(): void
  {
    $tenant = Tenant::factory()->create();
    User::factory()->forTenant($tenant)->support()->create([
      'email' => 'admin@example.com',
      'password' => 'password123',
    ]);

    $this->postJson('/api/v1/auth/login', [
      'email' => 'admin@example.com',
      'password' => 'password123',
    ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('email');
  }

  public function test_user_without_password_cannot_login(): void
  {
    $tenant = Tenant::factory()->create();
    User::factory()->forTenant($tenant)->admin()->create([
      'email' => 'admin@example.com',
      'password' => null,
    ]);

    $this->postJson('/api/v1/auth/login', [
      'email' => 'admin@example.com',
      'password' => 'password123',
    ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('email');
  }

  public function test_user_of_soft_deleted_tenant_cannot_login(): void
  {
    $tenant = Tenant::factory()->create();
    User::factory()->forTenant($tenant)->admin()->create([
      'email' => 'admin@example.com',
      'password' => 'password123',
    ]);

    $tenant->delete();

    $this->postJson('/api/v1/auth/login', [
      'email' => 'admin@example.com',
      'password' => 'password123',
    ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('email');
  }

  public function test_login_is_rate_limited(): void
  {
    $tenant = Tenant::factory()->create();
    User::factory()->forTenant($tenant)->admin()->create([
      'email' => 'admin@example.com',
      'password' => 'password123',
    ]);

    for ($attempt = 0; $attempt < 5; $attempt++) {
      $this->postJson('/api/v1/auth/login', [
        'email' => 'admin@example.com',
        'password' => 'wrong-password',
      ])->assertStatus(422);
    }

    $this->postJson('/api/v1/auth/login', [
      'email' => 'admin@example.com',
      'password' => 'wrong-password',
    ])->assertStatus(429);
  }

  public function test_authenticated_user_can_view_profile_and_logout(): void
  {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->forTenant($tenant)->admin()->create();

    $this->actingAs($admin)
      ->getJson('/api/v1/auth/me')
      ->assertOk()
      ->assertJsonPath('data.email', $admin->email)
      ->assertJsonPath('data.tenant.id', $tenant->id)
      ->assertJsonStructure(['data', 'csrf_token', 'redirect_url']);

    $this->actingAs($admin)
      ->postJson('/api/v1/auth/logout')
      ->assertOk()
      ->assertJsonPath('message', 'Logged out.');

    $this->assertGuest('web');
  }

  public function test_guest_cannot_view_profile(): void
  {
    $this->getJson('/api/v1/auth/me')->assertUnauthorized();
  }
}
