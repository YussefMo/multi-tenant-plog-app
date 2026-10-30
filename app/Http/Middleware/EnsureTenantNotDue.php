<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantNotDue
{
  /**
   * Block tenant writes when the tenant is marked due. Reads and billing/account
   * endpoints stay available so the tenant can subscribe or manage the session.
   */
  public function handle(Request $request, Closure $next): Response
  {
    if (in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
      return $next($request);
    }

    $user = $request->user();

    if (! $user instanceof User || $user->tenant_id === null) {
      return $next($request);
    }

    $tenant = $user->tenant;

    if (! $tenant instanceof Tenant || ! $tenant->is_due) {
      return $next($request);
    }

    if ($this->isAllowed($request)) {
      return $next($request);
    }

    abort(402, 'This tenant is marked due. Renew or subscribe to a plan to continue.');
  }

  private function isAllowed(Request $request): bool
  {
    return $request->is('api/v1/billing/*')
      || $request->is('api/v1/auth/logout')
      || $request->is('api/v1/auth/profile')
      || $request->is('api/v1/auth/password')
      || $request->is('api/v1/auth/support/end');
  }
}
