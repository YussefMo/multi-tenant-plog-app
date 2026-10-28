<?php

namespace Tests\Feature;

use App\Models\Owner;
use App\Models\Tenant;
use App\Models\TenantSupportAccess;
use App\Models\TenantSupportTicket;
use App\Models\User;
use App\Services\SupportUserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SupportAccessTest extends TestCase
{
  use RefreshDatabase;

  private Owner $owner;

  protected function setUp(): void
  {
    parent::setUp();

    $this->refreshOwnerDatabase();
    $this->owner = Owner::factory()->create();
  }

  public function test_owner_cannot_access_when_support_is_disabled(): void
  {
    $tenant = $this->tenant(false);

    $this->actingAs($this->owner, 'owner')
      ->postJson("/api/v1/owner/tenants/{$tenant->id}/access")
      ->assertForbidden();
  }

  public function test_owner_cannot_access_a_trashed_tenant(): void
  {
    $tenant = $this->tenant();
    $tenant->delete();

    $this->actingAs($this->owner, 'owner')
      ->postJson("/api/v1/owner/tenants/{$tenant->id}/access")
      ->assertForbidden();
  }

  public function test_owner_cannot_access_another_owners_tenant(): void
  {
    $otherOwner = Owner::factory()->create();
    $tenant = Tenant::factory()->forOwner($otherOwner)->create(['allow_support' => true]);

    $this->actingAs($this->owner, 'owner')
      ->postJson("/api/v1/owner/tenants/{$tenant->id}/access")
      ->assertNotFound();
  }

  public function test_owner_access_returns_tenant_frontend_redirect(): void
  {
    $tenant = $this->tenant();

    $response = $this->actingAs($this->owner, 'owner')
      ->postJson("/api/v1/owner/tenants/{$tenant->id}/access")
      ->assertCreated()
      ->assertJsonStructure(['ticket', 'expires_at', 'redirect_url']);

    $this->assertStringContainsString($tenant->slug, $response->json('redirect_url'));
    $this->assertStringContainsString('/support/accept?ticket=', $response->json('redirect_url'));
  }

  public function test_ticket_can_be_exchanged_for_a_support_session(): void
  {
    $tenant = $this->tenant();
    $ticket = $this->ticket($tenant);

    $this->postJson('/api/v1/auth/support-login', ['ticket' => $ticket])
      ->assertOk()
      ->assertJsonPath('support', true)
      ->assertJsonPath('data.role', 'admin')
      ->assertJsonPath('data.email', "support+{$tenant->id}@internal.invalid")
      ->assertJsonPath('data.tenant.id', $tenant->id)
      ->assertJsonStructure(['data', 'csrf_token', 'redirect_url']);

    $support = User::query()->where('is_support', true)->firstOrFail();

    $this->assertTrue($support->isSupport());
    $this->assertNull($support->password);
    $this->assertTrue($support->hasPermission('anything'));
    $this->assertAuthenticatedAs($support, 'web');
    $this->assertNotNull(TenantSupportTicket::query()->firstOrFail()->used_at);
    $this->assertDatabaseHas('tenant_support_accesses', [
      'tenant_id' => $tenant->id,
      'owner_id' => $this->owner->id,
      'impersonated_user_id' => $support->id,
      'ended_at' => null,
    ]);
  }

  public function test_ticket_is_single_use(): void
  {
    $tenant = $this->tenant();
    $ticket = $this->ticket($tenant);

    $this->postJson('/api/v1/auth/support-login', ['ticket' => $ticket])->assertOk();

    $this->postJson('/api/v1/auth/support-login', ['ticket' => $ticket])
      ->assertStatus(422)
      ->assertJsonValidationErrors('ticket');
  }

  public function test_expired_ticket_is_rejected(): void
  {
    $tenant = $this->tenant();
    $ticket = $this->ticket($tenant);

    TenantSupportTicket::query()->update(['expires_at' => now()->subMinute()]);

    $this->postJson('/api/v1/auth/support-login', ['ticket' => $ticket])
      ->assertStatus(422)
      ->assertJsonValidationErrors('ticket');
  }

  public function test_ticket_is_rejected_if_support_is_disabled_after_issue(): void
  {
    $tenant = $this->tenant();
    $ticket = $this->ticket($tenant);
    $tenant->update(['allow_support' => false]);

    $this->postJson('/api/v1/auth/support-login', ['ticket' => $ticket])
      ->assertStatus(422)
      ->assertJsonValidationErrors('ticket');
  }

  public function test_support_session_is_revoked_when_allow_support_is_disabled(): void
  {
    $tenant = $this->tenant();
    $ticket = $this->ticket($tenant);

    $this->postJson('/api/v1/auth/support-login', ['ticket' => $ticket])->assertOk();

    $support = User::query()->where('is_support', true)->firstOrFail();
    $access = TenantSupportAccess::query()->latest('id')->firstOrFail();

    $tenant->update(['allow_support' => false]);

    $this->actingAs($support)
      ->withSession([
        'support_owner_id' => $this->owner->id,
        'support_tenant_id' => $tenant->id,
        'support_access_id' => $access->id,
        'support_last_activity_at' => now()->timestamp,
      ])
      ->getJson('/api/v1/posts')
      ->assertForbidden();

    $this->assertGuest('web');
    $this->assertNotNull($access->fresh()->ended_at);
  }

  public function test_support_session_can_be_ended_explicitly(): void
  {
    $tenant = $this->tenant();
    $ticket = $this->ticket($tenant);

    $this->postJson('/api/v1/auth/support-login', ['ticket' => $ticket])->assertOk();

    $support = User::query()->where('is_support', true)->firstOrFail();
    $access = TenantSupportAccess::query()->latest('id')->firstOrFail();

    $this->actingAs($support)
      ->withSession([
        'support_owner_id' => $this->owner->id,
        'support_tenant_id' => $tenant->id,
        'support_access_id' => $access->id,
        'support_last_activity_at' => now()->timestamp,
      ])
      ->postJson('/api/v1/auth/support/end')
      ->assertOk()
      ->assertJsonPath('message', 'Support session ended.')
      ->assertJsonStructure(['message', 'redirect_url']);

    $this->assertGuest('web');
    $this->assertNotNull($access->fresh()->ended_at);
  }

  public function test_support_session_expires_after_inactivity(): void
  {
    $tenant = $this->tenant();
    $ticket = $this->ticket($tenant);

    $this->postJson('/api/v1/auth/support-login', ['ticket' => $ticket])->assertOk();

    $support = User::query()->where('is_support', true)->firstOrFail();
    $access = TenantSupportAccess::query()->latest('id')->firstOrFail();

    $this->actingAs($support)
      ->withSession([
        'support_owner_id' => $this->owner->id,
        'support_tenant_id' => $tenant->id,
        'support_access_id' => $access->id,
        'support_last_activity_at' => now()->subMinutes(6)->timestamp,
      ])
      ->getJson('/api/v1/posts')
      ->assertForbidden();

    $this->assertGuest('web');
    $this->assertNotNull($access->fresh()->ended_at);
  }

  public function test_hidden_support_user_is_not_visible_to_tenant_admins(): void
  {
    $tenant = $this->tenant();
    $admin = User::factory()->forTenant($tenant)->admin()->create();
    $support = app(SupportUserService::class)->forTenant($tenant);

    $this->actingAs($admin)
      ->getJson('/api/v1/users')
      ->assertOk()
      ->assertJsonCount(1, 'data');

    $this->actingAs($admin)
      ->getJson("/api/v1/users/{$support->id}")
      ->assertNotFound();
  }

  private function tenant(bool $allowSupport = true): Tenant
  {
    return Tenant::factory()
      ->forOwner($this->owner)
      ->create(['allow_support' => $allowSupport]);
  }

  private function ticket(Tenant $tenant): string
  {
    return $this->actingAs($this->owner, 'owner')
      ->postJson("/api/v1/owner/tenants/{$tenant->id}/access")
      ->assertCreated()
      ->json('ticket');
  }
}
