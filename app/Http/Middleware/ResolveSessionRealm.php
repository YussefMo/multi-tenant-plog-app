<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveSessionRealm
{
  public function handle(Request $request, Closure $next): Response
  {
    $isOwner = $request->is('api/v1/owner') || $request->is('api/v1/owner/*');

    config([
      'session.cookie' => $isOwner
        ? config('session.owner_cookie')
        : config('session.tenant_cookie'),
      'session.lifetime' => $isOwner
        ? config('session.owner_lifetime')
        : config('session.lifetime'),
    ]);

    return $next($request);
  }
}
