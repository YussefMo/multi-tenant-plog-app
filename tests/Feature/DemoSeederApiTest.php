<?php

namespace Tests\Feature;

use App\Models\Owner;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoSeederApiTest extends TestCase
{
  use RefreshDatabase;

  private Tenant $tenantOne;

  private User $admin;

  private User $viewer;

  private Owner $owner;

  protected function setUp(): void
  {
    parent::setUp();

    $this->refreshOwnerDatabase();
    $this->seed(DemoSeeder::class);

    $this->tenantOne = Tenant::query()->where('name', 'Demo Tenant')->firstOrFail();
    $this->admin = User::query()->where('email', 'admin@demo.test')->firstOrFail();
    $this->viewer = User::query()->where('email', 'viewer@demo.test')->firstOrFail();
    $this->owner = Owner::query()->where('email', 'owner@demo.test')->firstOrFail();
  }

  public function test_tenant_and_viewer_endpoints_return_seeded_data(): void
  {
    $this->actingAs($this->admin)
      ->getJson('/api/v1/posts')
      ->assertOk()
      ->assertJsonCount(15, 'data');

    $this->actingAs($this->admin)
      ->getJson('/api/v1/users')
      ->assertOk()
      ->assertJsonCount(2, 'data');

    $this->actingAs($this->admin)
      ->getJson('/api/v1/profiles')
      ->assertOk()
      ->assertJsonCount(1, 'data');

    $this->actingAs($this->admin)
      ->getJson('/api/v1/billing/subscription')
      ->assertOk()
      ->assertJsonPath('data.status', 'active');

    $this->actingAs($this->admin)
      ->getJson('/api/v1/billing/invoices')
      ->assertOk()
      ->assertJsonCount(12, 'data');

    $this->actingAs($this->admin)
      ->getJson('/api/v1/billing/payments')
      ->assertOk()
      ->assertJsonCount(12, 'data');

    $this->actingAs($this->viewer)
      ->getJson('/api/v1/tenants')
      ->assertOk()
      ->assertJsonCount(2, 'data');

    $this->actingAs($this->viewer)
      ->getJson("/api/v1/tenants/{$this->tenantOne->id}/posts")
      ->assertOk()
      ->assertJsonCount(15, 'data');
  }

  public function test_owner_billing_endpoints_return_seeded_data(): void
  {
    $this->actingAs($this->owner, 'owner')
      ->getJson('/api/v1/owner/tenants')
      ->assertOk()
      ->assertJsonCount(2, 'data');

    $this->actingAs($this->owner, 'owner')
      ->getJson('/api/v1/owner/plans')
      ->assertOk()
      ->assertJsonCount(2, 'data');

    $this->actingAs($this->owner, 'owner')
      ->getJson('/api/v1/owner/billing/transactions')
      ->assertOk()
      ->assertJsonCount(20, 'data');

    $response = $this->actingAs($this->owner, 'owner')
      ->getJson('/api/v1/owner/billing/metrics')
      ->assertOk()
      ->assertJsonPath('data.mrr', 25000)
      ->assertJsonPath('data.arr', 300000)
      ->assertJsonPath('data.subscriptions.active', 1)
      ->assertJsonPath('data.subscriptions.trialing', 1);

    $this->assertCount(12, $response->json('data.timeline'));
    $this->assertNotEmpty($response->json('data.payment_status_counts'));
    $this->assertNotEmpty($response->json('data.revenue_by_tenant'));
  }
}
