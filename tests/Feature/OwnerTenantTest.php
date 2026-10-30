<?php

namespace Tests\Feature;

use App\Models\Owner;
use App\Models\Plan;
use App\Models\Post;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantProvisioningService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OwnerTenantTest extends TestCase
{
  use RefreshDatabase;

  protected function setUp(): void
  {
    parent::setUp();

    $this->refreshOwnerDatabase();
  }

  public function test_owner_can_create_tenant(): void
  {
    $owner = Owner::factory()->create();

    $this->actingAs($owner, 'owner')
      ->postJson('/api/v1/owner/tenants', [
        'name' => 'Acme Inc',
        'category' => 'Technology',
        'admin_name' => 'Acme Admin',
        'admin_email' => 'admin@example.com',
        'allow_support' => true,
      ])
      ->assertCreated()
      ->assertJsonPath('data.name', 'Acme Inc')
      ->assertJsonPath('data.category', 'Technology')
      ->assertJsonPath('data.allow_support', false)
      ->assertJsonPath('data.is_due', true)
      ->assertJsonPath('admin.is_tenant_owner', true)
      ->assertJsonPath('admin.email', 'admin@example.com')
      ->assertJsonStructure(['invitation' => ['expires_at', 'token']]);

    $this->assertDatabaseHas('tenants', [
      'owner_id' => $owner->id,
      'name' => 'Acme Inc',
    ]);
    $this->assertDatabaseHas('users', [
      'email' => 'admin@example.com',
      'role' => 'admin',
      'password' => null,
    ]);
    $this->assertDatabaseHas('tenant_invitations', [
      'email' => 'admin@example.com',
      'accepted_at' => null,
    ]);
  }

  public function test_owner_cannot_create_a_tenant_with_an_existing_admin_email(): void
  {
    $owner = Owner::factory()->create();
    User::factory()->create(['email' => 'taken@example.com']);

    $this->actingAs($owner, 'owner')
      ->postJson('/api/v1/owner/tenants', [
        'name' => 'Acme Inc',
        'admin_name' => 'Acme Admin',
        'admin_email' => 'taken@example.com',
      ])
      ->assertStatus(422)
      ->assertJsonValidationErrors('admin_email')
      ->assertJsonPath('errors.admin_email.0', 'A user with this email already exists.');
  }

  public function test_duplicate_tenant_names_are_allowed(): void
  {
    $owner = Owner::factory()->create();

    $first = Tenant::factory()->forOwner($owner)->create(['name' => 'Acme']);
    $second = Tenant::factory()->forOwner($owner)->create(['name' => 'Acme']);

    $this->assertSame('Acme', $first->name);
    $this->assertSame('Acme', $second->name);
    $this->assertNotSame($first->id, $second->id);
  }

  public function test_owner_only_lists_their_own_tenants(): void
  {
    $owner = Owner::factory()->create();
    $otherOwner = Owner::factory()->create();

    $tenant = Tenant::factory()->forOwner($owner)->create();
    Tenant::factory()->forOwner($otherOwner)->create();

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/tenants')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.id', $tenant->id);
  }

  public function test_owner_sees_the_tenant_due_flag(): void
  {
    $owner = Owner::factory()->create();
    $tenant = Tenant::factory()->forOwner($owner)->create(['is_due' => true]);

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/tenants')
      ->assertOk()
      ->assertJsonPath('data.0.id', $tenant->id)
      ->assertJsonPath('data.0.is_due', true);
  }

  public function test_owner_can_update_tenant(): void
  {
    $owner = Owner::factory()->create();
    $tenant = Tenant::factory()->forOwner($owner)->create(['name' => 'Acme']);

    $this->actingAs($owner, 'owner')
      ->patchJson("/api/v1/owner/tenants/{$tenant->id}", [
        'name' => 'Acme Renamed',
        'category' => 'Finance',
      ])
      ->assertOk()
      ->assertJsonPath('data.name', 'Acme Renamed')
      ->assertJsonPath('data.category', 'Finance');
  }

  public function test_owner_can_soft_delete_and_restore_tenant(): void
  {
    $owner = Owner::factory()->create();
    $tenant = Tenant::factory()->forOwner($owner)->create();

    $this->actingAs($owner, 'owner')
      ->deleteJson("/api/v1/owner/tenants/{$tenant->id}")
      ->assertNoContent();

    $this->assertSoftDeleted('tenants', ['id' => $tenant->id]);

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/tenants')
      ->assertOk()
      ->assertJsonCount(0, 'data');

    $this->actingAs($owner, 'owner')
      ->postJson("/api/v1/owner/tenants/{$tenant->id}/restore")
      ->assertOk()
      ->assertJsonPath('data.id', $tenant->id);

    $this->assertNotSoftDeleted('tenants', ['id' => $tenant->id]);
  }

  public function test_owner_cannot_access_another_owners_tenant(): void
  {
    $owner = Owner::factory()->create();
    $otherOwner = Owner::factory()->create();
    $tenant = Tenant::factory()->forOwner($otherOwner)->create();

    $this->actingAs($owner, 'owner')
      ->getJson("/api/v1/owner/tenants/{$tenant->id}")
      ->assertNotFound();

    $this->actingAs($owner, 'owner')
      ->patchJson("/api/v1/owner/tenants/{$tenant->id}", ['name' => 'Hijacked'])
      ->assertNotFound();

    $this->actingAs($owner, 'owner')
      ->deleteJson("/api/v1/owner/tenants/{$tenant->id}")
      ->assertNotFound();
  }

  public function test_owner_cannot_restore_another_owners_trashed_tenant(): void
  {
    $owner = Owner::factory()->create();
    $otherOwner = Owner::factory()->create();
    $tenant = Tenant::factory()->forOwner($otherOwner)->create();
    $tenant->delete();

    $this->actingAs($owner, 'owner')
      ->postJson("/api/v1/owner/tenants/{$tenant->id}/restore")
      ->assertNotFound();

    $this->assertSoftDeleted('tenants', ['id' => $tenant->id]);
  }

  public function test_trashed_tenant_is_not_shown_or_updated(): void
  {
    $owner = Owner::factory()->create();
    $tenant = Tenant::factory()->forOwner($owner)->create();
    $tenant->delete();

    $this->actingAs($owner, 'owner')
      ->getJson("/api/v1/owner/tenants/{$tenant->id}")
      ->assertNotFound();

    $this->actingAs($owner, 'owner')
      ->patchJson("/api/v1/owner/tenants/{$tenant->id}", ['name' => 'Hidden'])
      ->assertNotFound();
  }

  public function test_guest_cannot_access_owner_tenant_routes(): void
  {
    $this->getJson('/api/v1/owner/tenants')->assertUnauthorized();
  }

  public function test_owner_can_search_and_filter_tenants_by_state_support_and_due(): void
  {
    $owner = Owner::factory()->create();
    $acme = Tenant::factory()->forOwner($owner)->create([
      'name' => 'Acme',
      'category' => 'Technology',
      'allow_support' => true,
      'is_due' => true,
    ]);
    Tenant::factory()->forOwner($owner)->create([
      'name' => 'Beta',
      'category' => 'Finance',
      'allow_support' => false,
      'is_due' => false,
    ]);
    $trashed = Tenant::factory()->forOwner($owner)->create(['name' => 'Acme Old']);
    $trashed->delete();

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/tenants?search=Acme')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.id', $acme->id);

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/tenants?category=Finance')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.name', 'Beta');

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/tenants?allow_support=1')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.id', $acme->id);

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/tenants?is_due=1')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.id', $acme->id);

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/tenants?state=trashed')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.id', $trashed->id);

    $response = $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/tenants?state=all');

    $response->assertOk()->assertJsonCount(3, 'data');
    $this->assertNotNull($response->json('data.2.deleted_at'));
  }

  public function test_owner_can_paginate_tenant_results(): void
  {
    $owner = Owner::factory()->create();
    Tenant::factory()->forOwner($owner)->count(3)->create();

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/tenants?per_page=2')
      ->assertOk()
      ->assertJsonCount(2, 'data')
      ->assertJsonPath('meta.per_page', 2)
      ->assertJsonPath('meta.total', 3);
  }

  public function test_tenant_detail_includes_admin_invitation_subscription_and_counts(): void
  {
    $owner = Owner::factory()->create();
    $result = app(TenantProvisioningService::class)->provision($owner, [
      'name' => 'Acme',
      'category' => 'Technology',
      'admin_name' => 'Acme Admin',
      'admin_email' => 'admin@acme.test',
    ]);

    $tenant = $result['tenant'];
    $admin = $result['admin'];

    $plan = Plan::factory()->create(['name' => 'Growth']);
    Subscription::factory()->forTenant($tenant)->forPlan($plan)->active()->create();

    Post::factory()->forAuthor($admin)->published()->create();
    Post::factory()->forAuthor($admin)->draft()->create();

    $this->actingAs($owner, 'owner')
      ->getJson("/api/v1/owner/tenants/{$tenant->id}")
      ->assertOk()
      ->assertJsonPath('data.admin.email', 'admin@acme.test')
      ->assertJsonPath('data.admin.role', 'admin')
      ->assertJsonPath('data.invitation.email', 'admin@acme.test')
      ->assertJsonPath('data.invitation.accepted_at', null)
      ->assertJsonPath('data.subscription.status', 'active')
      ->assertJsonPath('data.subscription.plan.name', 'Growth')
      ->assertJsonPath('data.counts.users', 1)
      ->assertJsonPath('data.counts.posts', 2);
  }
}
