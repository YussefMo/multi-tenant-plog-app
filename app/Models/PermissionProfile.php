<?php

namespace App\Models;

use Database\Factories\PermissionProfileFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $name
 * @property string|null $description
 * @property array<int, string> $permissions
 */
#[Fillable(['name', 'description', 'permissions'])]
class PermissionProfile extends Model
{
  /** @use HasFactory<PermissionProfileFactory> */
  use HasFactory;

  protected $attributes = [
    'permissions' => '[]',
  ];

  protected function casts(): array
  {
    return [
      'permissions' => 'array',
    ];
  }

  public function tenant(): BelongsTo
  {
    return $this->belongsTo(Tenant::class);
  }

  public function users(): HasMany
  {
    return $this->hasMany(User::class, 'permission_profile_id');
  }
}
