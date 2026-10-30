<?php

namespace Tests\Feature;

use App\Models\PermissionProfile;
use App\Models\Tenant;
use App\Models\TenantInvitation;
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
        'password_confirmation' => 'password123',
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

  public function test_admin_cannot_create_a_normal_user(): void
  {
    $this->actingAs($this->admin)
      ->postJson('/api/v1/users', [
        'name' => 'Viewer',
        'email' => 'viewer@example.com',
        'role' => 'user',
      ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('role');
  }

  public function test_password_is_required_when_invite_is_false(): void
  {
    $this->actingAs($this->admin)
      ->postJson('/api/v1/users', [
        'name' => 'Author',
        'email' => 'author@example.com',
        'role' => 'author',
        'invite' => false,
      ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('password');
  }

  public function test_admin_can_invite_an_author_without_a_password(): void
  {
    $this->actingAs($this->admin)
      ->postJson('/api/v1/users', [
        'name' => 'Author',
        'email' => 'author@example.com',
        'role' => 'author',
        'invite' => true,
      ])
      ->assertCreated()
      ->assertJsonPath('data.email', 'author@example.com')
      ->assertJsonPath('data.invitation.status', 'pending')
      ->assertJsonStructure(['data' => ['invitation' => ['expires_at', 'status']], 'invitation' => ['expires_at', 'token']]);

    $user = User::query()->where('email', 'author@example.com')->firstOrFail();

    $this->assertNull($user->password);
    $this->assertDatabaseHas('tenant_invitations', [
      'tenant_id' => $this->tenant->id,
      'email' => 'author@example.com',
      'accepted_at' => null,
    ]);
  }

  public function test_admin_can_resend_an_invitation(): void
  {
    $this->actingAs($this->admin)
      ->postJson('/api/v1/users', [
        'name' => 'Author',
        'email' => 'author@example.com',
        'role' => 'author',
        'invite' => true,
      ])
      ->assertCreated();

    $user = User::query()->where('email', 'author@example.com')->firstOrFail();
    $firstInvitationId = TenantInvitation::query()->where('email', $user->email)->value('id');

    $this->actingAs($this->admin)
      ->postJson("/api/v1/users/{$user->id}/invite")
      ->assertOk()
      ->assertJsonPath('message', 'Invitation sent.')
      ->assertJsonStructure(['invitation' => ['expires_at', 'token']]);

    $this->assertDatabaseMissing('tenant_invitations', ['id' => $firstInvitationId]);
    $this->assertDatabaseCount('tenant_invitations', 1);
  }

  public function test_invitation_cannot_be_resent_after_acceptance(): void
  {
    $user = User::factory()->forTenant($this->tenant)->author()->create();

    $this->actingAs($this->admin)
      ->postJson("/api/v1/users/{$user->id}/invite")
      ->assertStatus(422);
  }

  public function test_admin_can_filter_users(): void
  {
    $profile = PermissionProfile::factory()->forTenant($this->tenant)->create();
    $author = User::factory()->forTenant($this->tenant)->author()->create([
      'name' => 'Search Author',
      'permission_profile_id' => $profile->id,
    ]);
    User::factory()->forTenant($this->tenant)->admin()->create();

    $this->actingAs($this->admin)
      ->getJson('/api/v1/users?search=Search&role=author&permission_profile_id='.$profile->id)
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.id', $author->id);

    $this->actingAs($this->admin)
      ->getJson('/api/v1/users?per_page=1')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('meta.per_page', 1);
  }

  public function test_admin_cannot_change_their_own_role(): void
  {
    $this->actingAs($this->admin)
      ->patchJson("/api/v1/users/{$this->admin->id}", ['role' => 'author'])
      ->assertStatus(422);
  }

  public function test_admin_cannot_delete_the_tenant_owner(): void
  {
    $owner = User::factory()->forTenant($this->tenant)->tenantOwner()->create();

    $this->actingAs($this->admin)
      ->deleteJson("/api/v1/users/{$owner->id}")
      ->assertStatus(422)
      ->assertJsonPath('message', 'The tenant owner cannot be deleted.');
  }

  public function test_full_access_author_cannot_delete_the_tenant_owner(): void
  {
    $owner = User::factory()->forTenant($this->tenant)->tenantOwner()->create();
    $author = User::factory()->forTenant($this->tenant)->author()->create();
    $author->forceFill(['permissions' => ['*']])->save();

    $this->actingAs($author)
      ->deleteJson("/api/v1/users/{$owner->id}")
      ->assertStatus(422)
      ->assertJsonPath('message', 'The tenant owner cannot be deleted.');
  }

  public function test_admin_cannot_delete_another_admin(): void
  {
    $target = User::factory()->forTenant($this->tenant)->admin()->create();

    $this->actingAs($this->admin)
      ->deleteJson("/api/v1/users/{$target->id}")
      ->assertForbidden();
  }

  public function test_full_access_author_cannot_delete_an_admin(): void
  {
    $target = User::factory()->forTenant($this->tenant)->admin()->create();
    $author = User::factory()->forTenant($this->tenant)->author()->create();
    $author->forceFill(['permissions' => ['*']])->save();

    $this->actingAs($author)
      ->deleteJson("/api/v1/users/{$target->id}")
      ->assertForbidden();
  }

  public function test_tenant_owner_can_delete_another_admin(): void
  {
    $owner = User::factory()->forTenant($this->tenant)->tenantOwner()->create();
    $target = User::factory()->forTenant($this->tenant)->admin()->create();

    $this->actingAs($owner)
      ->deleteJson("/api/v1/users/{$target->id}")
      ->assertNoContent();
  }

  public function test_tenant_owner_role_cannot_be_changed(): void
  {
    $owner = User::factory()->forTenant($this->tenant)->tenantOwner()->create();

    $this->actingAs($this->admin)
      ->patchJson("/api/v1/users/{$owner->id}", ['role' => 'author'])
      ->assertStatus(422)
      ->assertJsonPath('message', 'The tenant owner role cannot be changed.');
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
