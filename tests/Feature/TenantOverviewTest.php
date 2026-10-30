<?php

namespace Tests\Feature;

use App\Models\PermissionProfile;
use App\Models\Plan;
use App\Models\Post;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantOverviewTest extends TestCase
{
  use RefreshDatabase;

  private Tenant $tenant;

  private User $admin;

  protected function setUp(): void
  {
    parent::setUp();

    $this->tenant = Tenant::factory()->create();
    $this->admin = User::factory()->forTenant($this->tenant)->admin()->create();
  }

  public function test_admin_overview_includes_counts_and_subscription(): void
  {
    $author = User::factory()->forTenant($this->tenant)->author()->create();
    PermissionProfile::factory()->forTenant($this->tenant)->create();

    Post::factory()->forAuthor($author)->published()->create();
    Post::factory()->forAuthor($author)->draft()->create();

    $plan = Plan::factory()->create(['name' => 'Growth']);
    Subscription::factory()->forTenant($this->tenant)->forPlan($plan)->active()->create();

    $this->actingAs($this->admin)
      ->getJson('/api/v1/tenant/overview')
      ->assertOk()
      ->assertJsonPath('data.tenant.id', $this->tenant->id)
      ->assertJsonPath('data.counts.users', 2)
      ->assertJsonPath('data.counts.profiles', 1)
      ->assertJsonPath('data.counts.posts.total', 2)
      ->assertJsonPath('data.counts.posts.published', 1)
      ->assertJsonPath('data.counts.posts.draft', 1)
      ->assertJsonPath('data.subscription.status', 'active')
      ->assertJsonPath('data.subscription.plan.name', 'Growth');
  }

  public function test_author_overview_hides_admin_sections_and_counts_visible_posts(): void
  {
    $author = User::factory()->forTenant($this->tenant)->author()->create();
    $otherAuthor = User::factory()->forTenant($this->tenant)->author()->create();

    Post::factory()->forAuthor($author)->draft()->create();
    Post::factory()->forAuthor($otherAuthor)->published()->create();

    $this->actingAs($author)
      ->getJson('/api/v1/tenant/overview')
      ->assertOk()
      ->assertJsonPath('data.counts.users', null)
      ->assertJsonPath('data.counts.profiles', null)
      ->assertJsonPath('data.subscription', null)
      ->assertJsonPath('data.counts.posts.total', 1)
      ->assertJsonPath('data.counts.posts.draft', 1);
  }
}
