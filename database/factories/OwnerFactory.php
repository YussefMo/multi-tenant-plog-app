<?php

namespace Database\Factories;

use App\Models\Owner;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Owner> */
class OwnerFactory extends Factory
{
  protected $model = Owner::class;

  public function definition(): array
  {
    return [
      'name' => fake()->name(),
      'email' => fake()->unique()->safeEmail(),
      'password' => 'password',
      'is_active' => true,
    ];
  }

  public function inactive(): static
  {
    return $this->state(fn (): array => ['is_active' => false]);
  }
}
