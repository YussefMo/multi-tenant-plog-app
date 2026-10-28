<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'category', 'allow_support'])]
class Tenant extends Model
{
  /** @use HasFactory<TenantFactory> */
  use HasFactory;
  use SoftDeletes;

  protected $attributes = [
    'allow_support' => false,
  ];

  protected function casts(): array
  {
    return [
      'allow_support' => 'boolean',
    ];
  }

  public function users(): HasMany
  {
    return $this->hasMany(User::class);
  }

  public function profiles(): HasMany
  {
    return $this->hasMany(PermissionProfile::class);
  }

  public function posts(): HasMany
  {
    return $this->hasMany(Post::class);
  }

  public function invitations(): HasMany
  {
    return $this->hasMany(TenantInvitation::class);
  }
}
