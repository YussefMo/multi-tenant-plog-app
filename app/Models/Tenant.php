<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

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

  protected static function booted(): void
  {
    static::creating(function (Tenant $tenant): void {
      if (blank($tenant->slug)) {
        $tenant->slug = $tenant->uniqueSlug();
      }
    });
  }

  public function users(): HasMany
  {
    return $this->hasMany(User::class);
  }

  public function profiles(): HasMany
  {
    return $this->hasMany(PermissionProfile::class);
  }

  private function uniqueSlug(): string
  {
    $base = Str::limit(Str::slug($this->name), 200, '') ?: 'tenant';
    $slug = $base;
    $suffix = 2;

    while (static::withTrashed()->where('slug', $slug)->exists()) {
      $slug = "{$base}-{$suffix}";
      $suffix++;
    }

    return $slug;
  }
}
