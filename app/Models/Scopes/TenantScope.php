<?php

namespace App\Models\Scopes;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

/**
 * @implements Scope<Model>
 */
class TenantScope implements Scope
{
  public function apply(Builder $builder, Model $model): void
  {
    $user = Auth::user();

    if ($user instanceof User && $user->tenant_id !== null) {
      $builder->where($model->getTable().'.tenant_id', $user->tenant_id);
    }
  }
}
