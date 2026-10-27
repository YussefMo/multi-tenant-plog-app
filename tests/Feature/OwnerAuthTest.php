<?php

namespace Tests\Feature;

use App\Models\Owner;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class OwnerAuthTest extends TestCase
{
  protected function setUp(): void
  {
    parent::setUp();

    $this->refreshOwnerDatabase();
    RateLimiter::clear('owner-login|owner@example.com|127.0.0.1');
  }

  public function test_owner_can_login(): void
  {
    $owner = Owner::factory()->create([
      'email' => 'owner@example.com',
      'password' => 'password123',
    ]);

    $this->postJson('/api/v1/owner/auth/login', [
      'email' => 'owner@example.com',
      'password' => 'password123',
    ])
      ->assertOk()
      ->assertJsonStructure(['data', 'csrf_token'])
      ->assertJsonPath('data.email', 'owner@example.com');

    $this->assertAuthenticatedAs($owner, 'owner');
  }

  public function test_invalid_credentials_are_rejected(): void
  {
    Owner::factory()->create([
      'email' => 'owner@example.com',
      'password' => 'password123',
    ]);

    $this->postJson('/api/v1/owner/auth/login', [
      'email' => 'owner@example.com',
      'password' => 'wrong-password',
    ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('email');

    $this->assertGuest('owner');
  }

  public function test_inactive_owner_cannot_login(): void
  {
    Owner::factory()->inactive()->create([
      'email' => 'owner@example.com',
      'password' => 'password123',
    ]);

    $this->postJson('/api/v1/owner/auth/login', [
      'email' => 'owner@example.com',
      'password' => 'password123',
    ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('email');

    $this->assertGuest('owner');
  }

  public function test_owner_can_view_profile_and_logout(): void
  {
    $owner = Owner::factory()->create();

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/auth/me')
      ->assertOk()
      ->assertJsonPath('data.email', $owner->email);

    $this->actingAs($owner, 'owner')
      ->postJson('/api/v1/owner/auth/logout')
      ->assertOk()
      ->assertJsonPath('message', 'Logged out.');

    $this->assertGuest('owner');
  }

  public function test_guest_cannot_view_owner_profile(): void
  {
    $this->getJson('/api/v1/owner/auth/me')->assertUnauthorized();
  }

  public function test_owner_guard_does_not_authenticate_tenant_routes(): void
  {
    $owner = Owner::factory()->create();

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/user')
      ->assertUnauthorized();
  }

  public function test_owner_login_is_rate_limited(): void
  {
    Owner::factory()->create([
      'email' => 'owner@example.com',
      'password' => 'password123',
    ]);

    for ($attempt = 0; $attempt < 5; $attempt++) {
      $this->postJson('/api/v1/owner/auth/login', [
        'email' => 'owner@example.com',
        'password' => 'wrong-password',
      ])->assertStatus(422);
    }

    $this->postJson('/api/v1/owner/auth/login', [
      'email' => 'owner@example.com',
      'password' => 'wrong-password',
    ])->assertStatus(429);
  }

  public function test_owner_create_command_creates_an_owner(): void
  {
    $this->artisan('owner:create', [
      '--name' => 'Owner',
      '--email' => 'owner@example.com',
      '--password' => 'password123',
    ])->assertSuccessful();

    $this->assertDatabaseHas('owners', [
      'email' => 'owner@example.com',
    ], 'owner');
  }
}
