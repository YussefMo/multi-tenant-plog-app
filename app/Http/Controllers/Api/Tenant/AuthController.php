<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\AcceptInvitationRequest;
use App\Http\Requests\Tenant\LoginRequest;
use App\Http\Requests\Tenant\SupportLoginRequest;
use App\Http\Resources\UserResource;
use App\Models\Tenant;
use App\Models\TenantInvitation;
use App\Models\TenantSupportAccess;
use App\Models\TenantSupportTicket;
use App\Models\User;
use App\Services\FrontendUrlService;
use App\Services\SupportUserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
  public function __construct(private readonly FrontendUrlService $frontends)
  {
  }

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

    return (new UserResource($user))->additional([
      'csrf_token' => csrf_token(),
      'redirect_url' => $this->redirectUrlFor($user),
    ]);
  }

  public function logout(Request $request): JsonResponse
  {
    $this->closeSupportAccess($request->session()->get('support_access_id'));

    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json(['message' => 'Logged out.']);
  }

  public function supportLogin(SupportLoginRequest $request, SupportUserService $supportUsers): JsonResponse
  {
    $ticket = TenantSupportTicket::query()
      ->where('token_hash', hash('sha256', (string) $request->input('ticket')))
      ->first();

    if (! $ticket || $ticket->isExpired()) {
      throw ValidationException::withMessages(['ticket' => 'Invalid or expired support ticket.']);
    }

    $tenant = $ticket->tenant;

    if (! $tenant || ! $tenant->allow_support) {
      throw ValidationException::withMessages(['ticket' => 'Support access is disabled for this tenant.']);
    }

    $support = $supportUsers->forTenant($tenant);

    $ticket->used_at = now();
    $ticket->save();

    Auth::guard('web')->login($support);
    $request->session()->put('support_owner_id', $ticket->owner_id);
    $request->session()->put('support_tenant_id', $tenant->id);
    $request->session()->put('support_last_activity_at', now()->timestamp);

    $access = new TenantSupportAccess([
      'impersonated_user_id' => $support->id,
      'started_at' => now(),
      'ip_address' => $request->ip(),
    ]);
    $access->tenant_id = $tenant->id;
    $access->owner_id = $ticket->owner_id;
    $access->save();
    $request->session()->put('support_access_id', $access->id);

    $support->load('tenant', 'profile');

    return (new UserResource($support))->additional([
      'csrf_token' => csrf_token(),
      'support' => true,
      'redirect_url' => $this->frontends->tenant($tenant),
    ])->response()->setStatusCode(200);
  }

  public function supportEnd(Request $request): JsonResponse
  {
    $accessId = $request->session()->get('support_access_id');

    abort_if($accessId === null, 403, 'No active support session.');

    $this->closeSupportAccess($accessId);

    Auth::guard('web')->logout();
    $request->session()->invalidate();
    $request->session()->regenerateToken();

    return response()->json([
      'message' => 'Support session ended.',
      'redirect_url' => $this->frontends->owner(),
    ]);
  }

  public function me(Request $request): UserResource
  {
    $user = $request->user();

    abort_unless($user instanceof User, 401);

    $user->load('tenant', 'profile');

    return (new UserResource($user))->additional([
      'csrf_token' => csrf_token(),
      'redirect_url' => $this->redirectUrlFor($user),
    ]);
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

  private function closeSupportAccess(mixed $accessId): void
  {
    if ($accessId !== null) {
      TenantSupportAccess::query()
        ->whereKey((int) $accessId)
        ->whereNull('ended_at')
        ->update(['ended_at' => now()]);
    }
  }

  private function redirectUrlFor(User $user): string
  {
    $tenant = $user->tenant;

    if (! $tenant instanceof Tenant) {
      return $this->frontends->owner();
    }

    return $user->role === UserRole::User
      ? $this->frontends->user($tenant)
      : $this->frontends->tenant($tenant);
  }
}
