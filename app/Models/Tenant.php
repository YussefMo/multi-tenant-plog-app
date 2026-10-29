<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['name', 'category', 'allow_support', 'is_due'])]
class Tenant extends Model
{
  /** @use HasFactory<TenantFactory> */
  use HasFactory;
  use SoftDeletes;

  protected $attributes = [
    'allow_support' => false,
    'is_due' => false,
  ];

  protected function casts(): array
  {
    return [
      'allow_support' => 'boolean',
      'is_due' => 'boolean',
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

  public function subscription(): HasOne
  {
    return $this->hasOne(Subscription::class);
  }

  public function invoices(): HasMany
  {
    return $this->hasMany(BillingInvoice::class);
  }

  public function payments(): HasMany
  {
    return $this->hasMany(BillingPayment::class);
  }
}
