<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use App\Models\TenantSupportAccess;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantActive
{
  public function handle(Request $request, Closure $next): Response
  {
    $user = $request->user();

    if (! $user instanceof User || $user->tenant_id === null) {
      return $next($request);
    }

    $tenant = Tenant::withTrashed()->find($user->tenant_id);

    if ($tenant !== null && ! $tenant->trashed()) {
      return $next($request);
    }

    $this->closeSupportAccess($request);

    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    abort(403, 'This tenant is no longer active.');
  }

  private function closeSupportAccess(Request $request): void
  {
    $accessId = $request->session()->get('support_access_id');

    if ($accessId !== null) {
      TenantSupportAccess::query()
        ->whereKey((int) $accessId)
        ->whereNull('ended_at')
        ->update(['ended_at' => now()]);
    }
  }
}
