<?php

namespace Tests\Feature;

use App\Models\PermissionProfile;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PermissionSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionSystemTest extends TestCase
{
  use RefreshDatabase;

  public function test_role_presets_are_materialized(): void
  {
    $tenant = Tenant::factory()->create();

    $admin = User::factory()->forTenant($tenant)->admin()->create();
    $author = User::factory()->forTenant($tenant)->author()->create();
    $viewer = User::factory()->forTenant($tenant)->create();

    $this->assertTrue($admin->hasPermission('users.delete'));
    $this->assertTrue($author->hasPermission('posts.create'));
    $this->assertFalse($author->hasPermission('posts.view.any'));
    $this->assertTrue($viewer->hasPermission('posts.view.published'));
  }

  public function test_profile_and_extra_permissions_are_merged(): void
  {
    $tenant = Tenant::factory()->create();
    $profile = PermissionProfile::factory()
      ->forTenant($tenant)
      ->withPermissions(['posts.view.any'])
      ->create();

    $user = User::factory()->forTenant($tenant)->author()->create([
      'permission_profile_id' => $profile->id,
      'extra_permissions' => ['posts.publish'],
    ]);

    app(PermissionSyncService::class)->sync($user);

    $this->assertContains('posts.view.any', $user->permissions);
    $this->assertContains('posts.publish', $user->permissions);
    $this->assertContains('posts.create', $user->permissions);
  }

  public function test_profile_updates_resync_assigned_users(): void
  {
    $tenant = Tenant::factory()->create();
    $profile = PermissionProfile::factory()
      ->forTenant($tenant)
      ->withPermissions(['posts.view.any'])
      ->create();

    $user = User::factory()->forTenant($tenant)->author()->create([
      'permission_profile_id' => $profile->id,
    ]);

    $permissions = app(PermissionSyncService::class);
    $permissions->sync($user);

    $this->assertContains('posts.view.any', $user->fresh()->permissions);

    $profile->update(['permissions' => ['posts.publish']]);
    $permissions->syncUsersForProfile($profile);

    $fresh = $user->fresh();
    $this->assertNotContains('posts.view.any', $fresh->permissions);
    $this->assertContains('posts.publish', $fresh->permissions);
  }

  public function test_support_users_have_wildcard_permissions(): void
  {
    $tenant = Tenant::factory()->create();
    $support = User::factory()->forTenant($tenant)->support()->create();

    $this->assertTrue($support->isSupport());
    $this->assertTrue($support->hasPermission('anything.at.all'));
  }

  public function test_permissions_sync_command_repairs_stale_permissions(): void
  {
    $tenant = Tenant::factory()->create();
    $user = User::factory()->forTenant($tenant)->author()->create();
    $user->forceFill(['permissions' => ['stale']])->saveQuietly();

    $this->artisan('permissions:sync')->assertSuccessful();

    $this->assertContains('posts.create', $user->fresh()->permissions);
  }
}
