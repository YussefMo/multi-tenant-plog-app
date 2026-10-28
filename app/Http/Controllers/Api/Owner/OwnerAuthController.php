<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\LoginRequest;
use App\Http\Resources\OwnerResource;
use App\Services\FrontendUrlService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OwnerAuthController extends Controller
{
  public function __construct(private readonly FrontendUrlService $frontends)
  {
  }

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

  public function logout(Request $request): JsonResponse
  {
    Auth::guard('owner')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json(['message' => 'Logged out.']);
  }

  public function me(Request $request): OwnerResource
  {
    return (new OwnerResource($request->user('owner')))
      ->additional(['redirect_url' => $this->frontends->owner()]);
  }
}
