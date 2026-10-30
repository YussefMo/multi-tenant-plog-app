<?php

namespace Database\Factories;

use App\Enums\UserRole;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<User> */
class UserFactory extends Factory
{
  public function definition(): array
  {
    return [
      'tenant_id' => null,
      'name' => fake()->name(),
      'email' => fake()->unique()->safeEmail(),
      'email_verified_at' => now(),
      'password' => 'password',
      'role' => UserRole::User,
      'permissions' => UserRole::User->permissions(),
      'extra_permissions' => [],
      'permission_profile_id' => null,
      'is_support' => false,
      'is_tenant_owner' => false,
      'remember_token' => Str::random(10),
    ];
  }

  public function forTenant(Tenant $tenant): static
  {
    return $this->state(fn (): array => ['tenant_id' => $tenant->id]);
  }

  public function admin(): static
  {
    return $this->state(fn (): array => [
      'role' => UserRole::Admin,
      'permissions' => UserRole::Admin->permissions(),
    ]);
  }

  public function tenantOwner(): static
  {
    return $this->state(fn (): array => [
      'role' => UserRole::Admin,
      'permissions' => UserRole::Admin->permissions(),
      'is_tenant_owner' => true,
    ]);
  }

  public function author(): static
  {
    return $this->state(fn (): array => [
      'role' => UserRole::Author,
      'permissions' => UserRole::Author->permissions(),
    ]);
  }

  public function support(): static
  {
    return $this->state(fn (): array => [
      'role' => UserRole::Admin,
      'permissions' => ['*'],
      'is_support' => true,
    ]);
  }

  public function unverified(): static
  {
    return $this->state(fn (): array => [
      'email_verified_at' => null,
    ]);
  }

  public function viewer(): static
  {
    return $this->state(fn (): array => [
      'tenant_id' => null,
      'role' => UserRole::User,
      'permissions' => UserRole::User->permissions(),
    ]);
  }
}
