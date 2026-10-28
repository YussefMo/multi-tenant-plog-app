<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantSettingsTest extends TestCase
{
  use RefreshDatabase;

  private Tenant $tenant;

  private User $admin;

  protected function setUp(): void
  {
    parent::setUp();

    $this->tenant = Tenant::factory()->create([
      'category' => 'Technology',
      'allow_support' => false,
    ]);
    $this->admin = User::factory()->forTenant($this->tenant)->admin()->create();
  }

  public function test_admin_can_view_tenant_settings(): void
  {
    $this->actingAs($this->admin)
      ->getJson('/api/v1/tenant')
      ->assertOk()
      ->assertJsonPath('data.id', $this->tenant->id)
      ->assertJsonPath('data.category', 'Technology')
      ->assertJsonPath('data.allow_support', false);
  }

  public function test_admin_can_update_tenant_settings(): void
  {
    $this->actingAs($this->admin)
      ->patchJson('/api/v1/tenant', [
        'name' => 'Acme Updated',
        'category' => 'Finance',
        'allow_support' => true,
      ])
      ->assertOk()
      ->assertJsonPath('data.name', 'Acme Updated')
      ->assertJsonPath('data.category', 'Finance')
      ->assertJsonPath('data.allow_support', true);
  }

  public function test_author_cannot_view_or_update_settings(): void
  {
    $author = User::factory()->forTenant($this->tenant)->author()->create();

    $this->actingAs($author)
      ->getJson('/api/v1/tenant')
      ->assertForbidden();

    $this->actingAs($author)
      ->patchJson('/api/v1/tenant', ['allow_support' => true])
      ->assertForbidden();
  }

  public function test_guest_cannot_access_tenant_settings(): void
  {
    $this->getJson('/api/v1/tenant')->assertUnauthorized();
  }
}
