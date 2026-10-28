<?php

namespace Tests\Feature;

use App\Models\Owner;
use App\Models\Tenant;
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

  public function test_guest_cannot_access_owner_tenant_routes(): void
  {
    $this->getJson('/api/v1/owner/tenants')->assertUnauthorized();
  }
}
