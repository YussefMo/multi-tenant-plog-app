<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\LoginRequest;
use App\Http\Requests\Owner\UpdateOwnerPasswordRequest;
use App\Http\Requests\Owner\UpdateOwnerProfileRequest;
use App\Http\Resources\OwnerResource;
use App\Models\Owner;
use App\Services\FrontendUrlService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

#[Group('Auth', description: 'Authentication endpoints for tenant users, viewers, support sessions, and owners.')]
class OwnerAuthController extends Controller
{
  public function __construct(private readonly FrontendUrlService $frontends)
  {
  }

  #[Endpoint(title: 'Owner login', description: 'Authenticate an owner on the owner_session cookie realm.')]
  public function login(LoginRequest $request): OwnerResource
  {
    $key = 'owner-login|'.Str::lower((string) $request->input('email')).'|'.$request->ip();

    if (RateLimiter::tooManyAttempts($key, 5)) {
      abort(429, 'Too many login attempts.');
    }

    $credentials = [
      'email' => $request->input('email'),
      'password' => $request->input('password'),
      'is_active' => true,
    ];

    if (! Auth::guard('owner')->attempt($credentials, $request->boolean('remember'))) {
      RateLimiter::hit($key, 60);

      throw ValidationException::withMessages([
        'email' => __('auth.failed'),
      ]);
    }

    RateLimiter::clear($key);

    return (new OwnerResource(Auth::guard('owner')->user()))
      ->additional([
        'csrf_token' => csrf_token(),
        'redirect_url' => $this->frontends->owner(),
      ]);
  }

  #[Endpoint(title: 'Owner logout', description: 'Log out the owner guard and invalidate the owner session.')]
  public function logout(Request $request): JsonResponse
  {
    Auth::guard('owner')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json(['message' => 'Logged out.']);
  }

  #[Endpoint(title: 'Current owner', description: 'Return the authenticated owner and the owner dashboard redirect URL.')]
  public function me(Request $request): OwnerResource
  {
    return (new OwnerResource($request->user('owner')))
      ->additional(['redirect_url' => $this->frontends->owner()]);
  }

  #[Endpoint(title: 'Update owner profile', description: 'Update the authenticated owner name and email.')]
  public function updateProfile(UpdateOwnerProfileRequest $request): OwnerResource
  {
    $owner = $request->user('owner');
    abort_unless($owner instanceof Owner, 401);

    $owner->fill($request->validated());
    $owner->save();

    return new OwnerResource($owner->refresh());
  }

  #[Endpoint(title: 'Update owner password', description: 'Change the owner password after verifying the current password.')]
  public function updatePassword(UpdateOwnerPasswordRequest $request): JsonResponse
  {
    $owner = $request->user('owner');
    abort_unless($owner instanceof Owner, 401);

    if (! Hash::check((string) $request->input('current_password'), $owner->password)) {
      throw ValidationException::withMessages([
        'current_password' => __('auth.password'),
      ]);
    }

    $owner->password = (string) $request->input('password');
    $owner->save();

    return response()->json(['message' => 'Password updated.']);
  }
}
