<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PermissionSyncService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PostTest extends TestCase
{
  use RefreshDatabase;

  private Tenant $tenant;

  private Tenant $otherTenant;

  private User $admin;

  private User $author;

  private User $otherAuthor;

  private User $viewer;

  private User $otherTenantAuthor;

  protected function setUp(): void
  {
    parent::setUp();

    $this->tenant = Tenant::factory()->create();
    $this->otherTenant = Tenant::factory()->create();
    $this->admin = User::factory()->forTenant($this->tenant)->admin()->create();
    $this->author = User::factory()->forTenant($this->tenant)->author()->create();
    $this->otherAuthor = User::factory()->forTenant($this->tenant)->author()->create();
    $this->viewer = User::factory()->forTenant($this->tenant)->create();
    $this->otherTenantAuthor = User::factory()->forTenant($this->otherTenant)->author()->create();
  }

  public function test_viewer_sees_only_published_posts_in_tenant(): void
  {
    $published = Post::factory()->forAuthor($this->author)->published()->create();
    Post::factory()->forAuthor($this->author)->create();
    Post::factory()->forAuthor($this->otherTenantAuthor)->published()->create();

    $this->actingAs($this->viewer)
      ->getJson('/api/v1/posts')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.id', $published->id);
  }

  public function test_author_sees_only_their_own_posts(): void
  {
    $ownDraft = Post::factory()->forAuthor($this->author)->create();
    $ownPublished = Post::factory()->forAuthor($this->author)->published()->create();
    Post::factory()->forAuthor($this->otherAuthor)->published()->create();

    $response = $this->actingAs($this->author)
      ->getJson('/api/v1/posts')
      ->assertOk()
      ->assertJsonCount(2, 'data');

    $ids = collect($response->json('data'))->pluck('id');

    $this->assertContains($ownDraft->id, $ids);
    $this->assertContains($ownPublished->id, $ids);
  }

  public function test_admin_sees_all_posts_in_tenant(): void
  {
    Post::factory()->forAuthor($this->author)->create();
    Post::factory()->forAuthor($this->author)->published()->create();
    Post::factory()->forAuthor($this->admin)->create();
    Post::factory()->forAuthor($this->otherTenantAuthor)->published()->create();

    $this->actingAs($this->admin)
      ->getJson('/api/v1/posts')
      ->assertOk()
      ->assertJsonCount(3, 'data');
  }

  public function test_cross_tenant_post_is_not_accessible(): void
  {
    $post = Post::factory()->forAuthor($this->otherTenantAuthor)->create();

    $this->actingAs($this->author)
      ->getJson("/api/v1/posts/{$post->id}")
      ->assertNotFound();
  }

  public function test_viewer_cannot_create_post(): void
  {
    $this->actingAs($this->viewer)
      ->postJson('/api/v1/posts', [
        'title' => 'Nope',
        'body' => 'Nope',
      ])
      ->assertForbidden();
  }

  public function test_author_can_create_update_and_soft_delete_own_post(): void
  {
    $create = $this->actingAs($this->author)
      ->postJson('/api/v1/posts', [
        'title' => 'First Post',
        'body' => 'Body',
      ])
      ->assertCreated()
      ->assertJsonPath('data.title', 'First Post')
      ->assertJsonPath('data.slug', 'first-post')
      ->assertJsonPath('data.status', 'draft');

    $postId = $create->json('data.id');

    $this->actingAs($this->author)
      ->patchJson("/api/v1/posts/{$postId}", [
        'title' => 'Updated Post',
        'body' => 'Updated body',
      ])
      ->assertOk()
      ->assertJsonPath('data.title', 'Updated Post');

    $this->actingAs($this->author)
      ->deleteJson("/api/v1/posts/{$postId}")
      ->assertNoContent();

    $this->assertSoftDeleted('posts', ['id' => $postId]);
  }

  public function test_author_cannot_update_or_delete_another_authors_post(): void
  {
    $post = Post::factory()->forAuthor($this->otherAuthor)->create();

    $this->actingAs($this->author)
      ->patchJson("/api/v1/posts/{$post->id}", ['title' => 'Nope'])
      ->assertForbidden();

    $this->actingAs($this->author)
      ->deleteJson("/api/v1/posts/{$post->id}")
      ->assertForbidden();
  }

  public function test_publish_requires_permission_and_ownership(): void
  {
    $post = Post::factory()->forAuthor($this->author)->create();

    $this->actingAs($this->author)
      ->postJson("/api/v1/posts/{$post->id}/publish")
      ->assertForbidden();

    $authorWithPublish = User::factory()->forTenant($this->tenant)->author()->create([
      'extra_permissions' => ['posts.publish'],
    ]);
    app(PermissionSyncService::class)->sync($authorWithPublish);

    $this->actingAs($authorWithPublish)
      ->postJson("/api/v1/posts/{$post->id}/publish")
      ->assertForbidden();

    $ownPost = Post::factory()->forAuthor($authorWithPublish)->create();

    $this->actingAs($authorWithPublish)
      ->postJson("/api/v1/posts/{$ownPost->id}/publish")
      ->assertOk()
      ->assertJsonPath('data.status', 'published');
  }

  public function test_unpublish_reverts_post_to_draft(): void
  {
    $post = Post::factory()->forAuthor($this->author)->published()->create();

    $this->actingAs($this->admin)
      ->postJson("/api/v1/posts/{$post->id}/unpublish")
      ->assertOk()
      ->assertJsonPath('data.status', 'draft')
      ->assertJsonPath('data.published_at', null);
  }

  public function test_slugs_are_unique_per_tenant(): void
  {
    $first = Post::factory()->forAuthor($this->author)->create(['title' => 'Same Title']);
    $second = Post::factory()->forAuthor($this->author)->create(['title' => 'Same Title']);
    $otherTenant = Post::factory()->forAuthor($this->otherTenantAuthor)->create(['title' => 'Same Title']);

    $this->assertSame('same-title', $first->slug);
    $this->assertSame('same-title-2', $second->slug);
    $this->assertSame('same-title', $otherTenant->slug);
  }

  public function test_soft_deleted_posts_are_hidden_from_index(): void
  {
    $post = Post::factory()->forAuthor($this->author)->published()->create();
    $post->delete();

    $this->actingAs($this->admin)
      ->getJson('/api/v1/posts')
      ->assertOk()
      ->assertJsonCount(0, 'data');
  }
}
