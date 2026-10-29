<?php

namespace Tests\Feature;

use App\Models\Owner;
use App\Models\Plan;
use App\Models\Post;
use App\Models\Tenant;
use Database\Seeders\DemoSeeder;
use Database\Seeders\PlanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoSeederTest extends TestCase
{
  use RefreshDatabase;

  public function test_demo_seeder_creates_owner_tenant_users_and_posts(): void
  {
    $this->refreshOwnerDatabase();

    $this->seed(DemoSeeder::class);

    $owner = Owner::query()->where('email', 'owner@demo.test')->firstOrFail();
    $tenant = Tenant::query()->where('name', 'Demo Tenant')->firstOrFail();

    $this->assertSame($owner->id, $tenant->owner_id);
    $this->assertDatabaseHas('users', [
      'email' => 'admin@demo.test',
      'tenant_id' => $tenant->id,
      'role' => 'admin',
    ]);
    $this->assertDatabaseHas('users', [
      'email' => 'author@demo.test',
      'tenant_id' => $tenant->id,
      'role' => 'author',
    ]);
    $this->assertDatabaseHas('users', [
      'email' => 'viewer@demo.test',
      'tenant_id' => null,
      'role' => 'user',
    ]);
    $this->assertDatabaseHas('users', [
      'tenant_id' => $tenant->id,
      'is_support' => true,
    ]);
    $this->assertDatabaseHas('permission_profiles', [
      'tenant_id' => $tenant->id,
      'name' => 'Editor',
    ]);
    $this->assertSame(2, Post::query()->where('tenant_id', $tenant->id)->count());
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
