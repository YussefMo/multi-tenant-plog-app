<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePermission
{
  public function handle(Request $request, Closure $next, string ...$permissions): Response
  {
    $user = $request->user();

    abort_unless($user instanceof User && $user->hasAnyPermission($permissions), 403);

    return $next($request);
  }
}
