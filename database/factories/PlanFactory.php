<?php

namespace Database\Factories;

use App\Models\Plan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Plan> */
class PlanFactory extends Factory
{
  protected $model = Plan::class;

  public function definition(): array
  {
    return [
      'name' => fake()->words(2, true),
      'slug' => Str::slug(fake()->unique()->words(3, true)),
      'stripe_product_id' => null,
      'stripe_price_id' => null,
      'amount' => fake()->numberBetween(500, 10000),
      'currency' => 'usd',
      'interval' => 'month',
      'features' => [],
      'limits' => [],
      'is_active' => true,
    ];
  }

  public function inactive(): static
  {
    return $this->state(fn (): array => ['is_active' => false]);
  }

  public function yearly(): static
  {
    return $this->state(fn (): array => ['interval' => 'year']);
  }
}
