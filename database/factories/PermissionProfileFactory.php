<?php

namespace Database\Factories;

use App\Models\PermissionProfile;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<PermissionProfile> */
class PermissionProfileFactory extends Factory
{
  public function definition(): array
  {
    return [
      'tenant_id' => 1,
      'name' => fake()->unique()->words(2, true),
      'description' => fake()->sentence(),
      'permissions' => [],
    ];
  }

  public function forTenant(Tenant $tenant): static
  {
    return $this->state(fn (): array => ['tenant_id' => $tenant->id]);
  }

  public function withPermissions(array $permissions): static
  {
    return $this->state(fn (): array => ['permissions' => $permissions]);
  }
}
