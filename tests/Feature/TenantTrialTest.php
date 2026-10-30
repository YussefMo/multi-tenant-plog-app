<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantTrialTest extends TestCase
{
  use RefreshDatabase;

  private Tenant $tenant;

  private User $admin;

  protected function setUp(): void
  {
    parent::setUp();

    $this->tenant = Tenant::factory()->create(['is_due' => true]);
    $this->admin = User::factory()->forTenant($this->tenant)->admin()->create();
  }

  public function test_admin_can_start_a_trial_once(): void
  {
    $this->actingAs($this->admin)
      ->postJson('/api/v1/billing/trial')
      ->assertCreated()
      ->assertJsonPath('data.status', 'trialing')
      ->assertJsonStructure(['data' => ['trial_ends_at']]);

    $this->tenant->refresh();

    $this->assertFalse($this->tenant->is_due);
    $this->assertNotNull($this->tenant->trial_used_at);
    $this->assertDatabaseHas('subscriptions', [
      'tenant_id' => $this->tenant->id,
      'status' => 'trialing',
      'plan_id' => null,
    ]);
  }

  public function test_trial_cannot_be_requested_twice(): void
  {
    $this->actingAs($this->admin)
      ->postJson('/api/v1/billing/trial')
      ->assertCreated();

    $this->actingAs($this->admin)
      ->postJson('/api/v1/billing/trial')
      ->assertStatus(422);
  }

  public function test_author_cannot_start_a_trial(): void
  {
    $author = User::factory()->forTenant($this->tenant)->author()->create();

    $this->actingAs($author)
      ->postJson('/api/v1/billing/trial')
      ->assertForbidden();
  }

  public function test_tenant_with_an_existing_subscription_cannot_start_a_trial(): void
  {
    Subscription::factory()->forTenant($this->tenant)->create();

    $this->actingAs($this->admin)
      ->postJson('/api/v1/billing/trial')
      ->assertStatus(422);
  }

  public function test_mark_due_command_marks_expired_trials(): void
  {
    $subscription = Subscription::factory()->forTenant($this->tenant)->create([
      'status' => 'trialing',
      'trial_ends_at' => now()->subDay(),
    ]);

    $this->tenant->forceFill(['is_due' => false])->save();

    $this->artisan('tenants:mark-due')->assertExitCode(0);

    $this->assertTrue($this->tenant->fresh()->is_due);
    $this->assertSame('past_due', $subscription->fresh()->status);
  }

  public function test_mark_due_command_keeps_active_trials(): void
  {
    Subscription::factory()->forTenant($this->tenant)->create([
      'status' => 'trialing',
      'trial_ends_at' => now()->addDay(),
    ]);

    $this->tenant->forceFill(['is_due' => false])->save();

    $this->artisan('tenants:mark-due')->assertExitCode(0);

    $this->assertFalse($this->tenant->fresh()->is_due);
  }

  public function test_mark_due_command_is_scheduled_daily(): void
  {
    $event = collect(app(\Illuminate\Console\Scheduling\Schedule::class)->events())
      ->first(fn ($event) => str_contains((string) $event->command, 'tenants:mark-due'));

    $this->assertNotNull($event);
    $this->assertSame('0 0 * * *', $event->expression);
  }
}
