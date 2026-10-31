<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('System', description: 'CSRF tokens, health checks, and the current user endpoint.')]
class SystemController extends Controller
{
  #[Endpoint(title: 'Tenant CSRF token', description: 'Return a CSRF token for the tenant_session realm.')]
  public function csrfToken(): JsonResponse
  {
    return response()->json(['csrf_token' => csrf_token()]);
  }

  #[Endpoint(title: 'Owner CSRF token', description: 'Return a CSRF token for the owner_session realm.')]
  public function ownerCsrfToken(): JsonResponse
  {
    return response()->json(['csrf_token' => csrf_token()]);
  }

  #[Endpoint(title: 'Health check', description: 'Return the API status, app name, version, and timestamp.')]
  public function health(): JsonResponse
  {
    return response()->json([
      'status' => 'ok',
      'app' => config('app.name'),
      'version' => 'v1',
      'timestamp' => now()->toIso8601String(),
    ]);
  }

  #[Endpoint(title: 'Current user', description: 'Return the authenticated user with tenant and profile.')]
  public function user(Request $request): UserResource
  {
    $user = $request->user();

    abort_unless($user instanceof User, 401);

    return new UserResource($user->load('tenant', 'profile'));
  }
}
