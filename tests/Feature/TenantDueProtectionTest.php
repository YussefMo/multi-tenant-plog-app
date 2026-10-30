<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantDueProtectionTest extends TestCase
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

  public function test_due_tenant_cannot_create_posts(): void
  {
    $this->actingAs($this->admin)
      ->postJson('/api/v1/posts', [
        'title' => 'Blocked',
        'body' => 'Blocked',
      ])
      ->assertStatus(402)
      ->assertJsonPath('message', 'This tenant is marked due. Renew or subscribe to a plan to continue.');
  }

  public function test_due_tenant_cannot_update_settings_or_users(): void
  {
    $this->actingAs($this->admin)
      ->patchJson('/api/v1/tenant', ['name' => 'Blocked'])
      ->assertStatus(402);

    $this->actingAs($this->admin)
      ->postJson('/api/v1/users', [
        'name' => 'Blocked',
        'email' => 'blocked@example.com',
        'role' => 'author',
        'invite' => true,
      ])
      ->assertStatus(402);
  }

  public function test_due_tenant_can_still_read_and_start_a_trial(): void
  {
    $this->actingAs($this->admin)
      ->getJson('/api/v1/posts')
      ->assertOk();

    $this->actingAs($this->admin)
      ->getJson('/api/v1/billing/subscription')
      ->assertOk();

    $this->actingAs($this->admin)
      ->postJson('/api/v1/billing/trial')
      ->assertCreated();

    $this->actingAs($this->admin)
      ->postJson('/api/v1/posts', [
        'title' => 'Allowed after trial',
        'body' => 'Allowed',
      ])
      ->assertCreated();
  }

  public function test_due_tenant_can_log_out(): void
  {
    $this->actingAs($this->admin)
      ->postJson('/api/v1/auth/logout')
      ->assertOk();
  }

  public function test_not_due_tenant_can_write(): void
  {
    $this->tenant->forceFill(['is_due' => false])->save();

    $this->actingAs($this->admin)
      ->postJson('/api/v1/posts', [
        'title' => 'Allowed',
        'body' => 'Allowed',
      ])
      ->assertCreated();
  }
}
