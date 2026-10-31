<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantDirectoryTest extends TestCase
{
  use RefreshDatabase;

  private User $viewer;

  protected function setUp(): void
  {
    parent::setUp();

    $this->viewer = User::factory()->create();
  }

  public function test_viewer_can_list_all_tenants_with_published_post_counts(): void
  {
    $first = Tenant::factory()->create(['name' => 'Acme', 'category' => 'Technology']);
    $second = Tenant::factory()->create(['name' => 'Beta', 'category' => 'Health']);
    $author = User::factory()->forTenant($first)->author()->create();

    Post::factory()->forAuthor($author)->published()->create();
    Post::factory()->forAuthor($author)->create();

    $response = $this->actingAs($this->viewer)
      ->getJson('/api/v1/tenants')
      ->assertOk()
      ->assertJsonCount(2, 'data');

    $tenants = collect($response->json('data'))->keyBy('id');

    $this->assertSame(1, $tenants[$first->id]['published_posts_count']);
    $this->assertSame(0, $tenants[$second->id]['published_posts_count']);
  }

  public function test_viewer_can_filter_tenants_by_name(): void
  {
    $acme = Tenant::factory()->create(['name' => 'Acme Inc']);
    Tenant::factory()->create(['name' => 'Beta Corp']);

    $response = $this->actingAs($this->viewer)
      ->getJson('/api/v1/tenants?name=acme')
      ->assertOk()
      ->assertJsonCount(1, 'data');

    $this->assertSame($acme->id, $response->json('data.0.id'));
  }

  public function test_viewer_can_filter_tenants_by_category(): void
  {
    $technology = Tenant::factory()->create(['name' => 'Acme', 'category' => 'Technology']);
    Tenant::factory()->create(['name' => 'Beta', 'category' => 'Health']);

    $response = $this->actingAs($this->viewer)
      ->getJson('/api/v1/tenants?category=Technology')
      ->assertOk()
      ->assertJsonCount(1, 'data');

    $this->assertSame($technology->id, $response->json('data.0.id'));
  }

  public function test_viewer_can_open_any_tenants_published_posts(): void
  {
    $tenant = Tenant::factory()->create();
    $author = User::factory()->forTenant($tenant)->author()->create();
    $published = Post::factory()->forAuthor($author)->published()->create();
    Post::factory()->forAuthor($author)->create();

    $otherTenant = Tenant::factory()->create();
    $otherAuthor = User::factory()->forTenant($otherTenant)->author()->create();
    Post::factory()->forAuthor($otherAuthor)->published()->create();

    $response = $this->actingAs($this->viewer)
      ->getJson("/api/v1/tenants/{$tenant->id}/posts")
      ->assertOk()
      ->assertJsonCount(1, 'data');

    $this->assertSame($published->id, $response->json('data.0.id'));
  }

  public function test_viewer_with_a_tenant_can_still_browse_other_tenants(): void
  {
    $homeTenant = Tenant::factory()->create();
    $viewer = User::factory()->forTenant($homeTenant)->create();

    $otherTenant = Tenant::factory()->create();
    $otherAuthor = User::factory()->forTenant($otherTenant)->author()->create();
    $post = Post::factory()->forAuthor($otherAuthor)->published()->create();

    $this->actingAs($viewer)
      ->getJson("/api/v1/tenants/{$otherTenant->id}/posts")
      ->assertOk()
      ->assertJsonPath('data.0.id', $post->id);
  }

  public function test_viewer_can_view_a_published_post_from_any_tenant(): void
  {
    $tenant = Tenant::factory()->create();
    $author = User::factory()->forTenant($tenant)->author()->create();
    $post = Post::factory()->forAuthor($author)->published()->create();

    $this->actingAs($this->viewer)
      ->getJson("/api/v1/posts/{$post->id}")
      ->assertOk()
      ->assertJsonPath('data.id', $post->id);
  }

  public function test_viewer_cannot_view_another_tenants_draft(): void
  {
    $tenant = Tenant::factory()->create();
    $author = User::factory()->forTenant($tenant)->author()->create();
    $post = Post::factory()->forAuthor($author)->create();

    $this->actingAs($this->viewer)
      ->getJson("/api/v1/posts/{$post->id}")
      ->assertForbidden();
  }

  public function test_soft_deleted_tenants_are_not_listed_or_browsable(): void
  {
    $tenant = Tenant::factory()->create();
    $tenant->delete();

    $this->actingAs($this->viewer)
      ->getJson('/api/v1/tenants')
      ->assertOk()
      ->assertJsonCount(0, 'data');

    $this->actingAs($this->viewer)
      ->getJson("/api/v1/tenants/{$tenant->id}/posts")
      ->assertNotFound();
  }

  public function test_tenant_admin_cannot_use_the_viewer_directory(): void
  {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->forTenant($tenant)->admin()->create();

    $this->actingAs($admin)
      ->getJson('/api/v1/tenants')
      ->assertForbidden();
  }

  public function test_viewer_can_search_tenants_by_name_or_category(): void
  {
    $acme = Tenant::factory()->create(['name' => 'Acme', 'category' => 'Technology']);
    $health = Tenant::factory()->create(['name' => 'Beta', 'category' => 'Health']);

    $byName = $this->actingAs($this->viewer)
      ->getJson('/api/v1/tenants?search=acme')
      ->assertOk()
      ->assertJsonCount(1, 'data');

    $this->assertSame($acme->id, $byName->json('data.0.id'));

    $byCategory = $this->actingAs($this->viewer)
      ->getJson('/api/v1/tenants?search=Health')
      ->assertOk()
      ->assertJsonCount(1, 'data');

    $this->assertSame($health->id, $byCategory->json('data.0.id'));
  }

  public function test_viewer_can_paginate_tenants_with_per_page(): void
  {
    Tenant::factory()->count(3)->create(['name' => 'Tenant']);

    $this->actingAs($this->viewer)
      ->getJson('/api/v1/tenants?per_page=2')
      ->assertOk()
      ->assertJsonCount(2, 'data')
      ->assertJsonPath('meta.total', 3)
      ->assertJsonPath('meta.last_page', 2);
  }

  public function test_pagination_links_keep_the_search_query(): void
  {
    Tenant::factory()->count(3)->create(['name' => 'Acme']);

    $response = $this->actingAs($this->viewer)
      ->getJson('/api/v1/tenants?search=Acme&per_page=1')
      ->assertOk();

    $this->assertStringContainsString('search=Acme', (string) $response->json('links.first'));
    $this->assertStringContainsString('per_page=1', (string) $response->json('links.first'));
  }

  public function test_viewer_can_open_a_tenant_profile(): void
  {
    $tenant = Tenant::factory()->create(['name' => 'Acme', 'category' => 'Technology']);
    $author = User::factory()->forTenant($tenant)->author()->create();

    Post::factory()->forAuthor($author)->published()->create();
    Post::factory()->forAuthor($author)->create();

    $this->actingAs($this->viewer)
      ->getJson("/api/v1/tenants/{$tenant->id}")
      ->assertOk()
      ->assertJsonPath('data.id', $tenant->id)
      ->assertJsonPath('data.name', 'Acme')
      ->assertJsonPath('data.category', 'Technology')
      ->assertJsonPath('data.published_posts_count', 1);
  }

  public function test_soft_deleted_tenant_profile_is_not_found(): void
  {
    $tenant = Tenant::factory()->create();
    $tenant->delete();

    $this->actingAs($this->viewer)
      ->getJson("/api/v1/tenants/{$tenant->id}")
      ->assertNotFound();
  }

  public function test_tenant_admin_cannot_open_the_viewer_tenant_profile(): void
  {
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->forTenant($tenant)->admin()->create();

    $this->actingAs($admin)
      ->getJson("/api/v1/tenants/{$tenant->id}")
      ->assertForbidden();
  }

  public function test_guest_cannot_open_the_viewer_tenant_profile(): void
  {
    $tenant = Tenant::factory()->create();

    $this->getJson("/api/v1/tenants/{$tenant->id}")->assertUnauthorized();
  }

  public function test_viewer_can_search_tenant_published_posts(): void
  {
    $tenant = Tenant::factory()->create();
    $author = User::factory()->forTenant($tenant)->author()->create();
    $match = Post::factory()->forAuthor($author)->published()->create(['title' => 'Laravel tips']);
    Post::factory()->forAuthor($author)->published()->create(['title' => 'Other article']);

    $response = $this->actingAs($this->viewer)
      ->getJson("/api/v1/tenants/{$tenant->id}/posts?search=Laravel")
      ->assertOk()
      ->assertJsonCount(1, 'data');

    $this->assertSame($match->id, $response->json('data.0.id'));
  }

  public function test_viewer_can_paginate_tenant_published_posts(): void
  {
    $tenant = Tenant::factory()->create();
    $author = User::factory()->forTenant($tenant)->author()->create();
    Post::factory()->forAuthor($author)->published()->count(3)->create();

    $this->actingAs($this->viewer)
      ->getJson("/api/v1/tenants/{$tenant->id}/posts?per_page=2")
      ->assertOk()
      ->assertJsonCount(2, 'data')
      ->assertJsonPath('meta.total', 3)
      ->assertJsonPath('meta.last_page', 2);
  }

  public function test_tenant_posts_include_the_tenant(): void
  {
    $tenant = Tenant::factory()->create(['name' => 'Acme']);
    $author = User::factory()->forTenant($tenant)->author()->create();
    Post::factory()->forAuthor($author)->published()->create();

    $this->actingAs($this->viewer)
      ->getJson("/api/v1/tenants/{$tenant->id}/posts")
      ->assertOk()
      ->assertJsonPath('data.0.tenant.id', $tenant->id)
      ->assertJsonPath('data.0.tenant.name', 'Acme');
  }

  public function test_published_post_detail_includes_the_tenant(): void
  {
    $tenant = Tenant::factory()->create(['name' => 'Acme']);
    $author = User::factory()->forTenant($tenant)->author()->create();
    $post = Post::factory()->forAuthor($author)->published()->create();

    $this->actingAs($this->viewer)
      ->getJson("/api/v1/posts/{$post->id}")
      ->assertOk()
      ->assertJsonPath('data.tenant.id', $tenant->id)
      ->assertJsonPath('data.tenant.name', 'Acme');
  }

  public function test_global_feed_excludes_posts_from_soft_deleted_tenants(): void
  {
    $tenant = Tenant::factory()->create();
    $author = User::factory()->forTenant($tenant)->author()->create();
    $post = Post::factory()->forAuthor($author)->published()->create();

    $tenant->delete();

    $this->actingAs($this->viewer)
      ->getJson('/api/v1/posts')
      ->assertOk()
      ->assertJsonCount(0, 'data');

    $this->actingAs($this->viewer)
      ->getJson("/api/v1/posts/{$post->id}")
      ->assertNotFound();
  }

  public function test_global_feed_is_ordered_by_published_at(): void
  {
    $tenant = Tenant::factory()->create();
    $author = User::factory()->forTenant($tenant)->author()->create();
    $older = Post::factory()->forAuthor($author)->published()->create([
      'published_at' => now()->subDays(2),
    ]);
    $newer = Post::factory()->forAuthor($author)->published()->create([
      'published_at' => now()->subDay(),
    ]);

    $this->actingAs($this->viewer)
      ->getJson('/api/v1/posts')
      ->assertOk()
      ->assertJsonPath('data.0.id', $newer->id)
      ->assertJsonPath('data.1.id', $older->id);
  }

  public function test_guest_cannot_use_the_viewer_directory(): void
  {
    $this->getJson('/api/v1/tenants')->assertUnauthorized();
  }
}
