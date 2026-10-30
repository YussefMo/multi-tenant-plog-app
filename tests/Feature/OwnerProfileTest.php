<?php

namespace Tests\Feature;

use App\Models\Owner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OwnerProfileTest extends TestCase
{
  use RefreshDatabase;

  protected function setUp(): void
  {
    parent::setUp();

    $this->refreshOwnerDatabase();
  }

  public function test_owner_can_update_profile(): void
  {
    $owner = Owner::factory()->create([
      'name' => 'Old Name',
      'email' => 'old@example.com',
    ]);

    $this->actingAs($owner, 'owner')
      ->patchJson('/api/v1/owner/auth/profile', [
        'name' => 'New Name',
        'email' => 'new@example.com',
      ])
      ->assertOk()
      ->assertJsonPath('data.name', 'New Name')
      ->assertJsonPath('data.email', 'new@example.com');

    $this->assertDatabaseHas('owners', [
      'id' => $owner->id,
      'name' => 'New Name',
      'email' => 'new@example.com',
    ], 'owner');
  }

  public function test_owner_profile_email_must_be_unique(): void
  {
    $owner = Owner::factory()->create();
    Owner::factory()->create(['email' => 'taken@example.com']);

    $this->actingAs($owner, 'owner')
      ->patchJson('/api/v1/owner/auth/profile', [
        'email' => 'taken@example.com',
      ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('email');
  }

  public function test_owner_can_update_password_with_current_password(): void
  {
    $owner = Owner::factory()->create(['password' => 'old-password']);

    $this->actingAs($owner, 'owner')
      ->putJson('/api/v1/owner/auth/password', [
        'current_password' => 'old-password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
      ])
      ->assertOk()
      ->assertJsonPath('message', 'Password updated.');

    $this->assertTrue(Hash::check('new-password', $owner->fresh()->password));
  }

  public function test_owner_password_update_requires_the_current_password(): void
  {
    $owner = Owner::factory()->create(['password' => 'old-password']);

    $this->actingAs($owner, 'owner')
      ->putJson('/api/v1/owner/auth/password', [
        'current_password' => 'wrong-password',
        'password' => 'new-password',
        'password_confirmation' => 'new-password',
      ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('current_password');

    $this->assertTrue(Hash::check('old-password', $owner->fresh()->password));
  }

  public function test_owner_password_update_requires_confirmation(): void
  {
    $owner = Owner::factory()->create(['password' => 'old-password']);

    $this->actingAs($owner, 'owner')
      ->putJson('/api/v1/owner/auth/password', [
        'current_password' => 'old-password',
        'password' => 'new-password',
      ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('password');
  }

  public function test_guest_cannot_update_owner_profile_or_password(): void
  {
    $this->patchJson('/api/v1/owner/auth/profile', ['name' => 'Guest'])->assertUnauthorized();
    $this->putJson('/api/v1/owner/auth/password', [
      'current_password' => 'password',
      'password' => 'new-password',
      'password_confirmation' => 'new-password',
    ])->assertUnauthorized();
  }
}
