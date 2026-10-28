<?php

namespace App\Http\Middleware;

use App\Models\TenantSupportAccess;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureSupportAccess
{
  public function handle(Request $request, Closure $next): Response
  {
    $accessId = $request->session()->get('support_access_id');

    if ($accessId === null) {
      return $next($request);
    }

    $access = TenantSupportAccess::query()->find((int) $accessId);
    $user = $request->user();
    $tenant = $access?->tenant;
    $lastActivity = $request->session()->get('support_last_activity_at');
    $idleSeconds = (int) config('support.session_idle_minutes', 5) * 60;
    $isIdle = $lastActivity === null || (now()->timestamp - (int) $lastActivity) >= $idleSeconds;

    if (
      ! $access
      || $access->ended_at !== null
      || ! $tenant
      || ! $tenant->allow_support
      || ! ($user instanceof User)
      || $access->impersonated_user_id !== $user->id
      || $isIdle
    ) {
      if ($access && $access->ended_at === null) {
        $access->update(['ended_at' => now()]);
      }

      Auth::guard('web')->logout();
      $request->session()->invalidate();
      $request->session()->regenerateToken();

      abort(403, 'Support access is no longer allowed.');
    }

    $request->session()->put('support_last_activity_at', now()->timestamp);

    return $next($request);
  }
}
