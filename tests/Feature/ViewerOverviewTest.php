<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ViewerOverviewTest extends TestCase
{
  use RefreshDatabase;

  private User $viewer;

  protected function setUp(): void
  {
    parent::setUp();

    $this->viewer = User::factory()->create();
  }

  public function test_viewer_sees_directory_counts_and_categories(): void
  {
    $first = Tenant::factory()->create(['name' => 'Acme', 'category' => 'Technology']);
    Tenant::factory()->create(['name' => 'Beta', 'category' => 'Health']);
    Tenant::factory()->create(['name' => 'Gamma', 'category' => 'Technology']);

    $author = User::factory()->forTenant($first)->author()->create();
    Post::factory()->forAuthor($author)->published()->count(2)->create();
    Post::factory()->forAuthor($author)->create();

    $this->actingAs($this->viewer)
      ->getJson('/api/v1/viewer/overview')
      ->assertOk()
      ->assertJsonPath('data.counts.tenants', 3)
      ->assertJsonPath('data.counts.published_posts', 2)
      ->assertJsonPath('data.categories', ['Health', 'Technology']);
  }

  public function test_overview_excludes_soft_deleted_tenants_and_drafts(): void
  {
    $active = Tenant::factory()->create(['name' => 'Acme']);
    $deleted = Tenant::factory()->create(['name' => 'Gone']);

    $author = User::factory()->forTenant($active)->author()->create();
    Post::factory()->forAuthor($author)->published()->create();
    Post::factory()->forAuthor($author)->create();

    $deletedAuthor = User::factory()->forTenant($deleted)->author()->create();
    Post::factory()->forAuthor($deletedAuthor)->published()->create();

    $deleted->delete();

    $this->actingAs($this->viewer)
      ->getJson('/api/v1/viewer/overview')
      ->assertOk()
      ->assertJsonPath('data.counts.tenants', 1)
      ->assertJsonPath('data.counts.published_posts', 1)
      ->assertJsonPath('data.recent_tenants.0.name', 'Acme')
      ->assertJsonPath('data.recent_posts.0.tenant.name', 'Acme');
  }

  public function test_overview_returns_recent_tenants_with_post_counts(): void
  {
    $tenant = Tenant::factory()->create(['name' => 'Acme', 'category' => 'Technology']);
    $author = User::factory()->forTenant($tenant)->author()->create();
    Post::factory()->forAuthor($author)->published()->create();

    $this->actingAs($this->viewer)
      ->getJson('/api/v1/viewer/overview')
      ->assertOk()
      ->assertJsonPath('data.recent_tenants.0.id', $tenant->id)
      ->assertJsonPath('data.recent_tenants.0.published_posts_count', 1);
  }

  public function test_overview_returns_recent_published_posts_with_tenant(): void
  {
    $tenant = Tenant::factory()->create(['name' => 'Acme']);
    $author = User::factory()->forTenant($tenant)->author()->create();
    $post = Post::factory()->forAuthor($author)->published()->create(['title' => 'Hello world']);

    $this->actingAs($this->viewer)
      ->getJson('/api/v1/viewer/overview')
      ->assertOk()
      ->assertJsonPath('data.recent_posts.0.id', $post->id)
      ->assertJsonPath('data.recent_posts.0.title', 'Hello world')
      ->assertJsonPath('data.recent_posts.0.tenant.id', $tenant->id)
      ->assertJsonPath('data.recent_posts.0.tenant.name', 'Acme');
  }

  public function test_tenant_admin_cannot_open_the_viewer_overview(): void
  {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->forTenant($tenant)->admin()->create();

    $this->actingAs($admin)
      ->getJson('/api/v1/viewer/overview')
      ->assertForbidden();
  }

  public function test_guest_cannot_open_the_viewer_overview(): void
  {
    $this->getJson('/api/v1/viewer/overview')->assertUnauthorized();
  }
}
