<?php

namespace Tests\Feature;

use App\Models\Post;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationHardeningTest extends TestCase
{
  use RefreshDatabase;

  private Tenant $tenant;

  private Tenant $otherTenant;

  private User $admin;

  private User $author;

  protected function setUp(): void
  {
    parent::setUp();

    $this->tenant = Tenant::factory()->create();
    $this->otherTenant = Tenant::factory()->create(['name' => 'Other Tenant']);
    $this->admin = User::factory()->forTenant($this->tenant)->admin()->create();
    $this->author = User::factory()->forTenant($this->tenant)->author()->create();
  }

  public function test_create_payload_cannot_assign_a_post_to_another_tenant(): void
  {
    $foreignAuthor = User::factory()->forTenant($this->otherTenant)->author()->create();

    $response = $this->actingAs($this->author)
      ->postJson('/api/v1/posts', [
        'title' => 'Escaped post',
        'body' => 'Body',
        'tenant_id' => $this->otherTenant->id,
        'user_id' => $foreignAuthor->id,
      ])
      ->assertCreated();

    $this->assertDatabaseHas('posts', [
      'id' => $response->json('data.id'),
      'tenant_id' => $this->tenant->id,
      'user_id' => $this->author->id,
    ]);

    $this->assertDatabaseMissing('posts', [
      'id' => $response->json('data.id'),
      'tenant_id' => $this->otherTenant->id,
    ]);
  }

  public function test_post_index_ignores_a_foreign_tenant_query_parameter(): void
  {
    Post::factory()->forAuthor($this->author)->published()->create(['title' => 'Own post']);

    $foreignAuthor = User::factory()->forTenant($this->otherTenant)->author()->create();
    Post::factory()->forAuthor($foreignAuthor)->published()->create(['title' => 'Foreign post']);

    $response = $this->actingAs($this->admin)
      ->getJson("/api/v1/posts?tenant_id={$this->otherTenant->id}")
      ->assertOk();

    $titles = collect($response->json('data'))->pluck('title');

    $this->assertTrue($titles->contains('Own post'));
    $this->assertFalse($titles->contains('Foreign post'));
  }

  public function test_cross_tenant_publish_and_delete_are_not_found(): void
  {
    $foreignAdmin = User::factory()->forTenant($this->otherTenant)->admin()->create();
    $foreignPost = Post::factory()->forAuthor($foreignAdmin)->create();

    $this->actingAs($this->admin)
      ->postJson("/api/v1/posts/{$foreignPost->id}/publish")
      ->assertNotFound();

    $this->actingAs($this->admin)
      ->deleteJson("/api/v1/posts/{$foreignPost->id}")
      ->assertNotFound();

    $this->assertDatabaseHas('posts', [
      'id' => $foreignPost->id,
      'status' => 'draft',
      'deleted_at' => null,
    ]);
  }

  public function test_cross_tenant_invitation_target_is_not_found(): void
  {
    $foreignUser = User::factory()->forTenant($this->otherTenant)->author()->create();

    $this->actingAs($this->admin)
      ->postJson("/api/v1/users/{$foreignUser->id}/invite")
      ->assertNotFound();

    $this->assertDatabaseCount('tenant_invitations', 0);
  }
}
