<?php

namespace Database\Factories;

use App\Models\Owner;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Tenant> */
class TenantFactory extends Factory
{
  protected $model = Tenant::class;

  public function definition(): array
  {
    return [
      'owner_id' => 1,
      'name' => fake()->company(),
      'category' => fake()->randomElement(['Technology', 'Health', 'Finance', 'Education']),
      'allow_support' => false,
      'is_due' => false,
    ];
  }

  public function forOwner(Owner $owner): static
  {
    return $this->state(fn (): array => ['owner_id' => $owner->id]);
  }

  public function due(): static
  {
    return $this->state(fn (): array => ['is_due' => true]);
  }
}
