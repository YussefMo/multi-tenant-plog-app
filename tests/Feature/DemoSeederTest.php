<?php

namespace Tests\Feature;

use App\Models\BillingInvoice;
use App\Models\BillingPayment;
use App\Models\Owner;
use App\Models\PermissionProfile;
use App\Models\Plan;
use App\Models\Post;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoSeederTest extends TestCase
{
  use RefreshDatabase;

  public function test_demo_seeder_creates_dashboard_and_chart_data(): void
  {
    $this->refreshOwnerDatabase();

    $this->seed(DemoSeeder::class);

    $owner = Owner::query()->where('email', 'owner@demo.test')->firstOrFail();
    $tenantOne = Tenant::query()->where('name', 'Demo Tenant')->firstOrFail();
    $tenantTwo = Tenant::query()->where('name', 'Demo Studio')->firstOrFail();

    $this->assertSame($owner->id, $tenantOne->owner_id);
    $this->assertSame($owner->id, $tenantTwo->owner_id);
    $this->assertSame(2, Tenant::query()->count());

    $this->assertDatabaseHas('users', [
      'email' => 'admin@demo.test',
      'tenant_id' => $tenantOne->id,
      'role' => 'admin',
    ]);
    $this->assertDatabaseHas('users', [
      'email' => 'author@demo.test',
      'tenant_id' => $tenantOne->id,
      'role' => 'author',
    ]);
    $this->assertDatabaseHas('users', [
      'email' => 'admin2@demo.test',
      'tenant_id' => $tenantTwo->id,
      'role' => 'admin',
    ]);
    $this->assertDatabaseHas('users', [
      'email' => 'author2@demo.test',
      'tenant_id' => $tenantTwo->id,
      'role' => 'author',
    ]);
    $this->assertDatabaseHas('users', [
      'email' => 'viewer@demo.test',
      'tenant_id' => null,
      'role' => 'user',
    ]);
    $this->assertSame(2, User::query()->where('is_support', true)->count());

    $this->assertSame(2, PermissionProfile::query()->count());
    $this->assertSame(100, Post::query()->count());
    $this->assertSame(50, Post::query()->where('tenant_id', $tenantOne->id)->count());
    $this->assertSame(40, Post::query()->where('tenant_id', $tenantOne->id)->where('status', 'published')->count());
    $this->assertSame(50, Post::query()->where('tenant_id', $tenantTwo->id)->count());

    $this->assertSame(2, Subscription::query()->count());
    $this->assertSame(24, BillingInvoice::query()->count());
    $this->assertSame(24, BillingPayment::query()->count());
  }

  public function test_demo_seeder_reuses_an_existing_owner(): void
  {
    $this->refreshOwnerDatabase();
    $existing = Owner::factory()->create(['email' => 'existing@demo.test']);

    $this->seed(DemoSeeder::class);

    $tenant = Tenant::query()->where('name', 'Demo Tenant')->firstOrFail();

    $this->assertSame($existing->id, $tenant->owner_id);
    $this->assertFalse(Owner::query()->where('email', 'owner@demo.test')->exists());
  }

  public function test_plan_seeder_creates_configured_plans(): void
  {
    config(['plans' => [
      'plan_1' => [
        'name' => 'Starter',
        'slug' => 'starter',
        'product_id' => null,
        'price_id' => null,
        'amount' => 1000,
        'currency' => 'usd',
        'interval' => 'month',
        'features' => [],
        'limits' => [],
      ],
    ]]);

    $this->seed(PlanSeeder::class);

    $this->assertDatabaseHas('plans', ['slug' => 'starter', 'amount' => 1000]);
    $this->assertSame(1, Plan::query()->count());
  }
}
