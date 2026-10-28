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

    $this->assertSame(rtrim(config('frontends.tenant'), '/').'/', $response->json('redirect_url'));
    $this->assertAuthenticatedAs($admin, 'web');
  }

  public function test_viewer_can_login_without_a_tenant(): void
  {
    $viewer = User::factory()->create([
      'email' => 'viewer@example.com',
      'password' => 'password123',
    ]);

    $response = $this->postJson('/api/v1/auth/login', [
      'email' => 'viewer@example.com',
      'password' => 'password123',
    ])
      ->assertOk()
      ->assertJsonPath('data.role', 'user')
      ->assertJsonPath('data.tenant_id', null)
      ->assertJsonPath('data.tenant', null);

    $this->assertSame(rtrim(config('frontends.user'), '/').'/', $response->json('redirect_url'));
    $this->assertAuthenticatedAs($viewer, 'web');
  }

  public function test_tenant_admin_without_a_tenant_cannot_login(): void
  {
    User::factory()->admin()->create([
      'tenant_id' => null,
      'email' => 'admin@example.com',
      'password' => 'password123',
    ]);

    $this->postJson('/api/v1/auth/login', [
      'email' => 'admin@example.com',
      'password' => 'password123',
    ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('email');

    $this->assertGuest('web');
  }

  public function test_viewer_can_register_without_a_tenant(): void
  {
    $response = $this->postJson('/api/v1/auth/register', [
      'name' => 'Viewer',
      'email' => 'viewer@example.com',
      'password' => 'password123',
      'password_confirmation' => 'password123',
    ])
      ->assertCreated()
      ->assertJsonPath('data.email', 'viewer@example.com')
      ->assertJsonPath('data.role', 'user')
      ->assertJsonPath('data.tenant_id', null)
      ->assertJsonPath('data.tenant', null)
      ->assertJsonStructure(['data', 'csrf_token', 'redirect_url']);

    $user = User::query()->where('email', 'viewer@example.com')->firstOrFail();

    $this->assertNull($user->tenant_id);
    $this->assertContains('posts.view.published', $user->permissions);
    $this->assertContains('tenants.view', $user->permissions);
    $this->assertSame(rtrim(config('frontends.user'), '/').'/', $response->json('redirect_url'));
    $this->assertAuthenticatedAs($user, 'web');
  }

  public function test_registration_rejects_an_existing_email(): void
  {
    User::factory()->create(['email' => 'viewer@example.com']);

    $this->postJson('/api/v1/auth/register', [
      'name' => 'Viewer',
      'email' => 'viewer@example.com',
      'password' => 'password123',
      'password_confirmation' => 'password123',
    ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('email');
  }

  public function test_registration_requires_matching_passwords(): void
  {
    $this->postJson('/api/v1/auth/register', [
      'name' => 'Viewer',
      'email' => 'viewer@example.com',
      'password' => 'password123',
      'password_confirmation' => 'different-password',
    ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('password');
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
