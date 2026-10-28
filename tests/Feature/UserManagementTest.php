<?php

namespace Tests\Feature;

use App\Models\PermissionProfile;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
  use RefreshDatabase;

  private Tenant $tenant;

  private User $admin;

  protected function setUp(): void
  {
    parent::setUp();

    $this->tenant = Tenant::factory()->create();
    $this->admin = User::factory()->forTenant($this->tenant)->admin()->create();
  }

  public function test_admin_lists_only_their_tenant_users_and_hides_support(): void
  {
    $otherTenant = Tenant::factory()->create();
    User::factory()->forTenant($otherTenant)->create();
    User::factory()->forTenant($this->tenant)->support()->create();
    $author = User::factory()->forTenant($this->tenant)->author()->create();

    $response = $this->actingAs($this->admin)
      ->getJson('/api/v1/users')
      ->assertOk()
      ->assertJsonCount(2, 'data');

    $this->assertContains($this->admin->id, collect($response->json('data'))->pluck('id'));
    $this->assertContains($author->id, collect($response->json('data'))->pluck('id'));
  }

  public function test_admin_can_create_user_with_profile_and_extras(): void
  {
    $profile = PermissionProfile::factory()
      ->forTenant($this->tenant)
      ->withPermissions(['posts.view.any'])
      ->create();

    $this->actingAs($this->admin)
      ->postJson('/api/v1/users', [
        'name' => 'Author',
        'email' => 'author@example.com',
        'password' => 'password123',
        'role' => 'author',
        'permission_profile_id' => $profile->id,
        'extra_permissions' => ['posts.publish'],
      ])
      ->assertCreated()
      ->assertJsonPath('data.email', 'author@example.com')
      ->assertJsonPath('data.role', 'author');

    $user = User::query()->where('email', 'author@example.com')->firstOrFail();

    $this->assertContains('posts.create', $user->permissions);
    $this->assertContains('posts.view.any', $user->permissions);
    $this->assertContains('posts.publish', $user->permissions);
  }

  public function test_admin_can_update_role_profile_and_extras(): void
  {
    $profile = PermissionProfile::factory()
      ->forTenant($this->tenant)
      ->withPermissions(['posts.view.any'])
      ->create();

    $user = User::factory()->forTenant($this->tenant)->create();

    $this->actingAs($this->admin)
      ->patchJson("/api/v1/users/{$user->id}", [
        'role' => 'author',
        'permission_profile_id' => $profile->id,
        'extra_permissions' => ['posts.publish'],
      ])
      ->assertOk()
      ->assertJsonPath('data.role', 'author');

    $fresh = $user->fresh();
    $this->assertContains('posts.create', $fresh->permissions);
    $this->assertContains('posts.view.any', $fresh->permissions);
    $this->assertContains('posts.publish', $fresh->permissions);
  }

  public function test_admin_cannot_change_their_own_role(): void
  {
    $this->actingAs($this->admin)
      ->patchJson("/api/v1/users/{$this->admin->id}", ['role' => 'author'])
      ->assertStatus(422);
  }

  public function test_cross_tenant_user_is_not_accessible(): void
  {
    $otherTenant = Tenant::factory()->create();
    $otherUser = User::factory()->forTenant($otherTenant)->create();

    $this->actingAs($this->admin)
      ->getJson("/api/v1/users/{$otherUser->id}")
      ->assertNotFound();

    $this->actingAs($this->admin)
      ->patchJson("/api/v1/users/{$otherUser->id}", ['name' => 'Nope'])
      ->assertNotFound();

    $this->actingAs($this->admin)
      ->deleteJson("/api/v1/users/{$otherUser->id}")
      ->assertNotFound();
  }

  public function test_support_user_is_not_accessible(): void
  {
    $support = User::factory()->forTenant($this->tenant)->support()->create();

    $this->actingAs($this->admin)
      ->getJson("/api/v1/users/{$support->id}")
      ->assertNotFound();
  }

  public function test_user_without_users_view_permission_is_forbidden(): void
  {
    $author = User::factory()->forTenant($this->tenant)->author()->create();

    $this->actingAs($author)
      ->getJson('/api/v1/users')
      ->assertForbidden();
  }

  public function test_guest_cannot_access_user_management(): void
  {
    $this->getJson('/api/v1/users')->assertUnauthorized();
  }

  public function test_invalid_permission_is_rejected(): void
  {
    $this->actingAs($this->admin)
      ->postJson('/api/v1/users', [
        'name' => 'Author',
        'email' => 'author@example.com',
        'role' => 'author',
        'extra_permissions' => ['not.a.permission'],
      ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('extra_permissions.0');
  }
}
