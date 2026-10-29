<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\BillingInvoice;
use App\Models\BillingPayment;
use App\Models\PermissionProfile;
use App\Models\Plan;
use App\Models\Post;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\TenantSupportAccess;
use App\Models\TenantSupportTicket;
use App\Models\User;
use App\Services\SupportUserService;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class TenantLifecycleTest extends TestCase
{
  use RefreshDatabase;

  public function test_tenant_routes_are_blocked_and_session_is_invalidated_when_tenant_is_trashed(): void
  {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->forTenant($tenant)->admin()->create();

    $tenant->delete();

    $this->actingAs($admin)
      ->getJson('/api/v1/auth/me')
      ->assertForbidden();

    $this->assertGuest('web');
  }

  public function test_restored_tenant_can_be_used_again(): void
  {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->forTenant($tenant)->admin()->create();

    $tenant->delete();

    $this->actingAs($admin)
      ->getJson('/api/v1/auth/me')
      ->assertForbidden();

    $tenant->restore();

    $this->actingAs($admin)
      ->getJson('/api/v1/auth/me')
      ->assertOk()
      ->assertJsonPath('data.tenant.id', $tenant->id);
  }

  public function test_viewer_without_a_tenant_is_not_affected_by_trashed_tenants(): void
  {
    $viewer = User::factory()->create();
    Tenant::factory()->create()->delete();

    $this->actingAs($viewer)
      ->getJson('/api/v1/auth/me')
      ->assertOk()
      ->assertJsonPath('data.tenant', null);

    $this->actingAs($viewer)
      ->getJson('/api/v1/tenants')
      ->assertOk();
  }

  public function test_support_session_is_revoked_when_tenant_is_trashed(): void
  {
    $tenant = Tenant::factory()->create(['allow_support' => true]);
    $support = app(SupportUserService::class)->forTenant($tenant);

    $access = new TenantSupportAccess([
      'impersonated_user_id' => $support->id,
      'started_at' => now(),
    ]);
    $access->tenant_id = $tenant->id;
    $access->owner_id = 1;
    $access->save();

    $tenant->delete();

    $this->actingAs($support)
      ->withSession([
        'support_owner_id' => 1,
        'support_tenant_id' => $tenant->id,
        'support_access_id' => $access->id,
        'support_last_activity_at' => now()->timestamp,
      ])
      ->getJson('/api/v1/posts')
      ->assertForbidden();

    $this->assertGuest('web');
    $this->assertNotNull($access->fresh()->ended_at);
  }

  public function test_purge_removes_expired_tenants_and_all_related_data(): void
  {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->forTenant($tenant)->admin()->create();
    $author = User::factory()->forTenant($tenant)->author()->create();
    $support = app(SupportUserService::class)->forTenant($tenant);

    $profile = PermissionProfile::factory()->forTenant($tenant)->create();
    $admin->update(['permission_profile_id' => $profile->id]);

    $plan = Plan::factory()->create();
    Subscription::factory()->forTenant($tenant)->forPlan($plan)->create();
    BillingInvoice::factory()->forTenant($tenant)->create();
    BillingPayment::factory()->forTenant($tenant)->create();

    $post = Post::factory()->forAuthor($author)->published()->create();
    $post->delete();

    $invitation = new TenantInvitation([
      'email' => 'invite@example.com',
      'role' => UserRole::Admin,
      'permissions' => [],
      'token_hash' => hash('sha256', 'invitation-token'),
      'expires_at' => now()->addDays(7),
    ]);
    $invitation->tenant_id = $tenant->id;
    $invitation->save();

    $ticket = new TenantSupportTicket([
      'token_hash' => hash('sha256', 'support-ticket'),
      'expires_at' => now()->addMinutes(5),
    ]);
    $ticket->tenant_id = $tenant->id;
    $ticket->owner_id = 1;
    $ticket->save();

    $access = new TenantSupportAccess([
      'impersonated_user_id' => $support->id,
      'started_at' => now(),
    ]);
    $access->tenant_id = $tenant->id;
    $access->owner_id = 1;
    $access->save();

    $adminSessionId = Str::random(40);
    $viewerSessionId = Str::random(40);
    $viewer = User::factory()->create();

    DB::table('sessions')->insert([
      [
        'id' => $adminSessionId,
        'user_id' => $admin->id,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'phpunit',
        'payload' => '',
        'last_activity' => now()->timestamp,
      ],
      [
        'id' => $viewerSessionId,
        'user_id' => $viewer->id,
        'ip_address' => '127.0.0.1',
        'user_agent' => 'phpunit',
        'payload' => '',
        'last_activity' => now()->timestamp,
      ],
    ]);

    DB::table('password_reset_tokens')->insert([
      'email' => $admin->email,
      'token' => hash('sha256', 'reset-token'),
      'created_at' => now(),
    ]);

    $tenant->delete();
    $this->travel(31)->days();

    $this->artisan('tenants:purge')->assertExitCode(0);

    $this->assertDatabaseMissing('tenants', ['id' => $tenant->id]);
    $this->assertDatabaseMissing('users', ['tenant_id' => $tenant->id]);
    $this->assertDatabaseMissing('permission_profiles', ['tenant_id' => $tenant->id]);
    $this->assertDatabaseMissing('tenant_invitations', ['tenant_id' => $tenant->id]);
    $this->assertDatabaseMissing('tenant_support_tickets', ['tenant_id' => $tenant->id]);
    $this->assertDatabaseMissing('tenant_support_accesses', ['tenant_id' => $tenant->id]);
    $this->assertDatabaseMissing('posts', ['tenant_id' => $tenant->id]);
    $this->assertDatabaseMissing('subscriptions', ['tenant_id' => $tenant->id]);
    $this->assertDatabaseMissing('billing_invoices', ['tenant_id' => $tenant->id]);
    $this->assertDatabaseMissing('billing_payments', ['tenant_id' => $tenant->id]);
    $this->assertDatabaseMissing('sessions', ['id' => $adminSessionId]);
    $this->assertDatabaseMissing('password_reset_tokens', ['email' => $admin->email]);

    $this->assertDatabaseHas('plans', ['id' => $plan->id]);

    $this->assertDatabaseHas('users', ['id' => $viewer->id]);
    $this->assertDatabaseHas('sessions', ['id' => $viewerSessionId]);
  }

  public function test_purge_keeps_tenants_inside_the_retention_window(): void
  {
    $tenant = Tenant::factory()->create();
    $tenant->delete();

    $this->travel(10)->days();

    $this->artisan('tenants:purge')->assertExitCode(0);

    $this->assertSoftDeleted('tenants', ['id' => $tenant->id]);
  }

  public function test_due_tenant_is_not_scheduled_for_deletion_or_purged(): void
  {
    $tenant = Tenant::factory()->create(['is_due' => true]);

    $this->artisan('tenants:purge')->assertExitCode(0);

    $this->assertDatabaseHas('tenants', [
      'id' => $tenant->id,
      'is_due' => true,
      'deleted_at' => null,
    ]);
  }

  public function test_purge_command_is_scheduled_daily(): void
  {
    $event = collect(app(Schedule::class)->events())
      ->first(fn ($event) => str_contains((string) $event->command, 'tenants:purge'));

    $this->assertNotNull($event);
    $this->assertSame('0 0 * * *', $event->expression);
  }
}
