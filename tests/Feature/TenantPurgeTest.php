<?php

namespace Tests\Feature;

use App\Models\Owner;
use App\Models\Plan;
use App\Models\Post;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\TenantPurge;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantPurgeTest extends TestCase
{
  use RefreshDatabase;

  protected function setUp(): void
  {
    parent::setUp();

    $this->refreshOwnerDatabase();
  }

  public function test_owner_can_force_delete_a_trashed_tenant_and_write_an_audit_row(): void
  {
    $owner = Owner::factory()->create();
    $tenant = Tenant::factory()->forOwner($owner)->create(['name' => 'Acme']);
    $admin = User::factory()->forTenant($tenant)->admin()->create(['email' => 'admin@acme.test']);
    Post::factory()->forAuthor($admin)->published()->create();

    $tenant->delete();

    $this->actingAs($owner, 'owner')
      ->deleteJson("/api/v1/owner/tenants/{$tenant->id}/force")
      ->assertNoContent();

    $this->assertDatabaseMissing('tenants', ['id' => $tenant->id]);
    $this->assertDatabaseMissing('users', ['tenant_id' => $tenant->id]);
    $this->assertDatabaseMissing('posts', ['tenant_id' => $tenant->id]);

    $this->assertDatabaseHas('tenant_purges', [
      'tenant_id' => $tenant->id,
      'owner_id' => $owner->id,
      'tenant_name' => 'Acme',
      'admin_email' => 'admin@acme.test',
      'purged_by_owner_id' => $owner->id,
    ]);
  }

  public function test_active_tenant_cannot_be_force_deleted(): void
  {
    $owner = Owner::factory()->create();
    $tenant = Tenant::factory()->forOwner($owner)->create();

    $this->actingAs($owner, 'owner')
      ->deleteJson("/api/v1/owner/tenants/{$tenant->id}/force")
      ->assertStatus(422);

    $this->assertDatabaseHas('tenants', ['id' => $tenant->id]);
    $this->assertDatabaseCount('tenant_purges', 0);
  }

  public function test_owner_cannot_force_delete_another_owners_tenant(): void
  {
    $owner = Owner::factory()->create();
    $otherOwner = Owner::factory()->create();
    $tenant = Tenant::factory()->forOwner($otherOwner)->create();
    $tenant->delete();

    $this->actingAs($owner, 'owner')
      ->deleteJson("/api/v1/owner/tenants/{$tenant->id}/force")
      ->assertNotFound();

    $this->assertSoftDeleted('tenants', ['id' => $tenant->id]);
    $this->assertDatabaseCount('tenant_purges', 0);
  }

  public function test_owner_can_list_their_purged_tenant_history(): void
  {
    $owner = Owner::factory()->create();
    $otherOwner = Owner::factory()->create();

    $tenant = Tenant::factory()->forOwner($owner)->create(['name' => 'Acme']);
    $tenant->delete();
    $this->actingAs($owner, 'owner')
      ->deleteJson("/api/v1/owner/tenants/{$tenant->id}/force")
      ->assertNoContent();

    $otherTenant = Tenant::factory()->forOwner($otherOwner)->create(['name' => 'Other']);
    $otherTenant->delete();
    $this->actingAs($otherOwner, 'owner')
      ->deleteJson("/api/v1/owner/tenants/{$otherTenant->id}/force")
      ->assertNoContent();

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/tenants/purged')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.tenant_id', $tenant->id)
      ->assertJsonPath('data.0.tenant_name', 'Acme')
      ->assertJsonPath('data.0.owner_id', $owner->id)
      ->assertJsonStructure(['data' => [['id', 'tenant_id', 'owner_id', 'tenant_name', 'admin_email', 'purged_by_owner_id', 'purged_at', 'snapshot']]]);
  }

  public function test_purge_command_writes_an_audit_row_without_a_purging_owner(): void
  {
    $owner = Owner::factory()->create();
    $tenant = Tenant::factory()->forOwner($owner)->create(['name' => 'Expired']);
    $tenant->delete();

    $this->travel(31)->days();

    $this->artisan('tenants:purge')->assertExitCode(0);

    $this->assertDatabaseMissing('tenants', ['id' => $tenant->id]);
    $this->assertDatabaseHas('tenant_purges', [
      'tenant_id' => $tenant->id,
      'owner_id' => $owner->id,
      'tenant_name' => 'Expired',
      'purged_by_owner_id' => null,
    ]);
  }

  public function test_purge_audit_snapshot_records_the_deleted_tenant_state(): void
  {
    $owner = Owner::factory()->create();
    $tenant = Tenant::factory()->forOwner($owner)->create();
    $admin = User::factory()->forTenant($tenant)->admin()->create(['email' => 'admin@acme.test']);
    $plan = Plan::factory()->create(['name' => 'Growth']);
    Subscription::factory()->forTenant($tenant)->forPlan($plan)->active()->create();

    $tenant->delete();

    $this->actingAs($owner, 'owner')
      ->deleteJson("/api/v1/owner/tenants/{$tenant->id}/force")
      ->assertNoContent();

    $purge = TenantPurge::query()->firstOrFail();

    $this->assertSame('admin@acme.test', $purge->admin_email);
    $this->assertSame(1, $purge->snapshot['counts']['users']);
    $this->assertSame('Growth', $purge->snapshot['subscription']['plan']);
    $this->assertSame('admin@acme.test', $purge->snapshot['users'][0]['email']);
  }
}
