<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $name
 * @property string $email
 * @property \App\Enums\UserRole $role
 * @property array<int, string> $permissions
 * @property array<int, string> $extra_permissions
 * @property bool $is_support
 * @property \App\Models\PermissionProfile|null $profile
 * @property \App\Models\Tenant $tenant
 */
#[Fillable(['name', 'email', 'password', 'role', 'permission_profile_id', 'extra_permissions'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
  /** @use HasFactory<UserFactory> */
  use HasFactory;
  use Notifiable;

  protected $attributes = [
    'permissions' => '[]',
    'extra_permissions' => '[]',
    'is_support' => false,
  ];

  protected function casts(): array
  {
    return [
      'role' => UserRole::class,
      'permissions' => 'array',
      'extra_permissions' => 'array',
      'is_support' => 'boolean',
      'email_verified_at' => 'datetime',
      'password' => 'hashed',
    ];
  }

  public function tenant(): BelongsTo
  {
    return $this->belongsTo(Tenant::class);
  }

  public function profile(): BelongsTo
  {
    return $this->belongsTo(PermissionProfile::class, 'permission_profile_id');
  }

  public function hasPermission(string $permission): bool
  {
    $permissions = $this->permissions ?? [];

    return in_array('*', $permissions, true) || in_array($permission, $permissions, true);
  }

  public function hasAnyPermission(array $permissions): bool
  {
    foreach ($permissions as $permission) {
      if ($this->hasPermission($permission)) {
        return true;
      }
    }

    return false;
  }

  public function isSupport(): bool
  {
    return (bool) $this->is_support;
  }
}
