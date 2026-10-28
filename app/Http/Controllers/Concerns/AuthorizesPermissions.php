<?php

namespace App\Http\Controllers\Concerns;

use App\Models\User;
use Illuminate\Http\Request;

trait AuthorizesPermissions
{
  protected function ensureCanGrant(Request $request, array $permissions): void
  {
    $actor = $request->user();

    abort_unless($actor instanceof User, 403);

    if ($actor->hasPermission('*')) {
      return;
    }

    abort_unless(array_diff($permissions, $actor->permissions ?? []) === [], 403);
  }
}
