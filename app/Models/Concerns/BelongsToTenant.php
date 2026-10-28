<?php

namespace App\Models\Concerns;

use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Auth;

/**
 * @mixin Model
 * @phpstan-require-extends Model
 * @method static void addGlobalScope(\Illuminate\Database\Eloquent\Scope|string $scope)
 * @method static void creating(callable $callback)
 */
trait BelongsToTenant
{
  protected static function bootBelongsToTenant(): void
  {
    static::addGlobalScope(new TenantScope());

    static::creating(function (Model $model): void {
      if ($model->getAttribute('tenant_id') === null) {
        $user = Auth::user();

        if ($user instanceof User) {
          $model->setAttribute('tenant_id', $user->tenant_id);
        }
      }
    });
  }

  public function tenant(): BelongsTo
  {
    return $this->belongsTo(Tenant::class);
  }
}
