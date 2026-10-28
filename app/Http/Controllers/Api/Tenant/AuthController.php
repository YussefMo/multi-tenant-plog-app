<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\AcceptInvitationRequest;
use App\Http\Requests\Tenant\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\TenantInvitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
  public function login(LoginRequest $request): UserResource
  {
    $key = 'tenant-login|'.Str::lower((string) $request->input('email')).'|'.$request->ip();

    if (RateLimiter::tooManyAttempts($key, 5)) {
      abort(429, 'Too many login attempts.');
    }

    $candidate = User::query()->where('email', $request->input('email'))->first();

    if (
      ! $candidate
      || $candidate->isSupport()
      || $candidate->password === null
      || $candidate->tenant === null
    ) {
      RateLimiter::hit($key, 60);

      throw ValidationException::withMessages(['email' => __('auth.failed')]);
    }

    if (! Auth::guard('web')->attempt($request->only('email', 'password'), $request->boolean('remember'))) {
      RateLimiter::hit($key, 60);

      throw ValidationException::withMessages(['email' => __('auth.failed')]);
    }

    RateLimiter::clear($key);

    $user = User::query()->findOrFail(Auth::guard('web')->id());
    $user->load('tenant', 'profile');

    return (new UserResource($user))->additional(['csrf_token' => csrf_token()]);
  }

  public function logout(Request $request): JsonResponse
  {
    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json(['message' => 'Logged out.']);
  }

  public function me(Request $request): UserResource
  {
    $user = $request->user();

    abort_unless($user instanceof User, 401);

    $user->load('tenant', 'profile');

    return (new UserResource($user))->additional(['csrf_token' => csrf_token()]);
  }

  public function acceptInvitation(AcceptInvitationRequest $request): JsonResponse
  {
    $invitation = TenantInvitation::query()
      ->where('email', $request->input('email'))
      ->latest()
      ->first();

    $tokenHash = hash('sha256', (string) $request->input('token'));

    if (
      ! $invitation
      || ! hash_equals($invitation->token_hash, $tokenHash)
      || $invitation->isExpired()
      || $invitation->tenant === null
    ) {
      throw ValidationException::withMessages(['token' => 'Invalid or expired invitation.']);
    }

    $user = User::query()
      ->where('tenant_id', $invitation->tenant_id)
      ->where('email', $invitation->email)
      ->where('is_support', false)
      ->first();

    if (! $user || $user->password !== null) {
      throw ValidationException::withMessages(['token' => 'Invalid or expired invitation.']);
    }

    $user->password = $request->input('password');
    $user->email_verified_at = now();
    $user->save();

    $invitation->accepted_at = now();
    $invitation->save();

    return response()->json(['message' => 'Invitation accepted.']);
  }
}
