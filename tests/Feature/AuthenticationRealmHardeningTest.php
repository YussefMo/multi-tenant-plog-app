<?php

namespace Tests\Feature;

use App\Models\Owner;
use App\Models\Post;
use App\Models\Tenant;
use App\Models\User;
use App\Services\SupportUserService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationRealmHardeningTest extends TestCase
{
  use RefreshDatabase;

  public function test_owner_authentication_does_not_authenticate_tenant_routes(): void
  {
    $this->refreshOwnerDatabase();
    $owner = Owner::factory()->create();

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/auth/me')
      ->assertUnauthorized();
  }

  public function test_tenant_authentication_does_not_authenticate_owner_routes(): void
  {
    $this->refreshOwnerDatabase();
    $tenant = Tenant::factory()->create();
    $admin = User::factory()->forTenant($tenant)->admin()->create();

    $this->actingAs($admin)
      ->getJson('/api/v1/owner/auth/me')
      ->assertUnauthorized();
  }

  public function test_support_user_session_does_not_authenticate_owner_routes(): void
  {
    $this->refreshOwnerDatabase();
    $tenant = Tenant::factory()->create(['allow_support' => true]);
    $support = app(SupportUserService::class)->forTenant($tenant);

    $this->actingAs($support)
      ->getJson('/api/v1/owner/tenants')
      ->assertUnauthorized();
  }

  public function test_support_user_is_scoped_to_its_own_tenant(): void
  {
    $ownTenant = Tenant::factory()->create(['allow_support' => true]);
    $otherTenant = Tenant::factory()->create(['allow_support' => true]);

    $support = app(SupportUserService::class)->forTenant($ownTenant);
    $foreignAuthor = User::factory()->forTenant($otherTenant)->author()->create();
    $foreignPost = Post::factory()->forAuthor($foreignAuthor)->published()->create();

    $this->actingAs($support)
      ->getJson("/api/v1/posts/{$foreignPost->id}")
      ->assertNotFound();

    $this->assertTrue($support->hasPermission('posts.view.any'));
  }
}
