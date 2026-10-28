<?php

namespace Database\Factories;

use App\Enums\PostStatus;
use App\Models\Post;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Post> */
class PostFactory extends Factory
{
  protected $model = Post::class;

  public function definition(): array
  {
    return [
      'tenant_id' => 1,
      'user_id' => 1,
      'title' => fake()->sentence(4),
      'body' => fake()->paragraphs(3, true),
      'status' => PostStatus::Draft,
      'published_at' => null,
    ];
  }

  public function forTenant(Tenant $tenant): static
  {
    return $this->state(fn (): array => ['tenant_id' => $tenant->id]);
  }

  public function forAuthor(User $author): static
  {
    return $this->state(fn (): array => [
      'tenant_id' => $author->tenant_id,
      'user_id' => $author->id,
    ]);
  }

  public function published(): static
  {
    return $this->state(fn (): array => [
      'status' => PostStatus::Published,
      'published_at' => now(),
    ]);
  }
}
