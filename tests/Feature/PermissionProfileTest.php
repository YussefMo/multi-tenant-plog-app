<?php

namespace Tests\Feature;

use App\Models\PermissionProfile;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PermissionSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionProfileTest extends TestCase
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

  public function test_admin_can_create_profile(): void
  {
    $this->actingAs($this->admin)
      ->postJson('/api/v1/profiles', [
        'name' => 'Editors',
        'description' => 'Can review content',
        'permissions' => ['posts.view.any', 'posts.publish'],
      ])
      ->assertCreated()
      ->assertJsonPath('data.name', 'Editors')
      ->assertJsonPath('data.users_count', 0);
  }

  public function test_invalid_permission_is_rejected(): void
  {
    $this->actingAs($this->admin)
      ->postJson('/api/v1/profiles', [
        'name' => 'Editors',
        'permissions' => ['not.a.permission'],
      ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('permissions.0');
  }

  public function test_profile_update_resyncs_assigned_users(): void
  {
    $profile = PermissionProfile::factory()
      ->forTenant($this->tenant)
      ->withPermissions(['posts.view.any'])
      ->create();

    $user = User::factory()->forTenant($this->tenant)->author()->create([
      'permission_profile_id' => $profile->id,
    ]);

    app(PermissionSyncService::class)->sync($user);
    $this->assertContains('posts.view.any', $user->fresh()->permissions);

    $this->actingAs($this->admin)
      ->patchJson("/api/v1/profiles/{$profile->id}", [
        'permissions' => ['posts.publish'],
      ])
      ->assertOk();

    $fresh = $user->fresh();
    $this->assertNotContains('posts.view.any', $fresh->permissions);
    $this->assertContains('posts.publish', $fresh->permissions);
  }

  public function test_support_users_are_not_counted_in_profile_user_count(): void
  {
    $profile = PermissionProfile::factory()->forTenant($this->tenant)->create();

    User::factory()->forTenant($this->tenant)->support()->create([
      'permission_profile_id' => $profile->id,
    ]);

    $this->actingAs($this->admin)
      ->getJson('/api/v1/profiles')
      ->assertOk()
      ->assertJsonPath('data.0.users_count', 0);
  }

  public function test_assigned_profile_cannot_be_deleted(): void
  {
    $profile = PermissionProfile::factory()->forTenant($this->tenant)->create();
    User::factory()->forTenant($this->tenant)->create([
      'permission_profile_id' => $profile->id,
    ]);

    $this->actingAs($this->admin)
      ->deleteJson("/api/v1/profiles/{$profile->id}")
      ->assertStatus(409);
  }

  public function test_cross_tenant_profile_is_not_accessible(): void
  {
    $otherTenant = Tenant::factory()->create();
    $profile = PermissionProfile::factory()->forTenant($otherTenant)->create();

    $this->actingAs($this->admin)
      ->getJson("/api/v1/profiles/{$profile->id}")
      ->assertNotFound();

    $this->actingAs($this->admin)
      ->patchJson("/api/v1/profiles/{$profile->id}", ['name' => 'Nope'])
      ->assertNotFound();
  }

  public function test_limited_actor_cannot_grant_permissions_they_do_not_have(): void
  {
    $actor = User::factory()->forTenant($this->tenant)->create([
      'extra_permissions' => ['profiles.create', 'profiles.view'],
    ]);
    app(PermissionSyncService::class)->sync($actor);

    $this->actingAs($actor)
      ->postJson('/api/v1/profiles', [
        'name' => 'Escalation',
        'permissions' => ['users.delete'],
      ])
      ->assertForbidden();
  }

  public function test_admin_can_search_profiles(): void
  {
    PermissionProfile::factory()->forTenant($this->tenant)->create(['name' => 'Editors']);
    PermissionProfile::factory()->forTenant($this->tenant)->create(['name' => 'Reviewers']);

    $this->actingAs($this->admin)
      ->getJson('/api/v1/profiles?search=Edit')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.name', 'Editors');
  }

  public function test_admin_can_load_permission_catalog(): void
  {
    $this->actingAs($this->admin)
      ->getJson('/api/v1/permissions')
      ->assertOk()
      ->assertJsonPath('data.catalog.0', 'posts.view.any')
      ->assertJsonPath('data.presets.admin.0', '*');
  }
}
