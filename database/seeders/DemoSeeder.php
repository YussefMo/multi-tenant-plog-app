<?php

namespace Database\Seeders;

use App\Enums\PostStatus;
use App\Enums\UserRole;
use App\Models\Owner;
use App\Models\PermissionProfile;
use App\Models\Post;
use App\Models\Tenant;
use App\Models\User;
use App\Services\PermissionSyncService;
use App\Services\SupportUserService;
use Illuminate\Database\Seeder;

class DemoSeeder extends Seeder
{
  public function run(): void
  {
    $owner = Owner::query()->orderBy('id')->first();

    if (! $owner instanceof Owner) {
      $owner = Owner::query()->updateOrCreate(
        ['email' => 'owner@demo.test'],
        ['name' => 'Demo Owner', 'password' => 'password', 'is_active' => true],
      );
    }

    $tenant = Tenant::query()->firstOrNew(['name' => 'Demo Tenant']);
    $tenant->fill([
      'category' => 'Technology',
      'allow_support' => true,
      'is_due' => false,
    ]);
    $tenant->owner_id = $owner->id;
    $tenant->save();

    $profile = PermissionProfile::query()->firstOrNew([
      'tenant_id' => $tenant->id,
      'name' => 'Editor',
    ]);
    $profile->fill([
      'description' => 'Can edit any tenant post.',
      'permissions' => ['posts.view.any', 'posts.update.any'],
    ]);
    $profile->tenant_id = $tenant->id;
    $profile->save();

    $admin = $this->user(
      'admin@demo.test',
      'Demo Admin',
      UserRole::Admin,
      $tenant,
      null,
    );
    $author = $this->user(
      'author@demo.test',
      'Demo Author',
      UserRole::Author,
      $tenant,
      $profile,
    );
    $this->user(
      'viewer@demo.test',
      'Demo Viewer',
      UserRole::User,
      null,
      null,
    );
    app(SupportUserService::class)->forTenant($tenant);

    $published = Post::query()
      ->where('tenant_id', $tenant->id)
      ->where('title', 'Welcome to the demo')
      ->first();

    if (! $published instanceof Post) {
      $published = new Post([
        'title' => 'Welcome to the demo',
        'body' => 'This is a seeded published post.',
        'status' => PostStatus::Published,
        'published_at' => now(),
      ]);
      $published->tenant_id = $tenant->id;
      $published->user_id = $author->id;
      $published->save();
    }

    $draft = Post::query()
      ->where('tenant_id', $tenant->id)
      ->where('title', 'Draft post')
      ->first();

    if (! $draft instanceof Post) {
      $draft = new Post([
        'title' => 'Draft post',
        'body' => 'This is a seeded draft.',
        'status' => PostStatus::Draft,
      ]);
      $draft->tenant_id = $tenant->id;
      $draft->user_id = $admin->id;
      $draft->save();
    }

    $this->command?->info('Seeded demo tenant, users, profile, and posts.');
  }

  private function user(
    string $email,
    string $name,
    UserRole $role,
    ?Tenant $tenant,
    ?PermissionProfile $profile,
  ): User {
    $user = User::query()->firstOrNew(['email' => $email]);
    $user->fill([
      'name' => $name,
      'password' => 'password',
      'role' => $role,
      'permission_profile_id' => $profile?->id,
      'extra_permissions' => [],
    ]);
    $user->tenant_id = $tenant?->id;
    $user->permissions = $role->permissions();
    $user->is_support = false;
    $user->email_verified_at = now();
    $user->save();

    app(PermissionSyncService::class)->sync($user);

    return $user;
  }
}
