<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Enums\UserRole;
use App\Http\Controllers\Concerns\AuthorizesPermissions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreUserRequest;
use App\Http\Requests\Tenant\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\PermissionProfile;
use App\Models\User;
use App\Notifications\TenantInvitationNotification;
use App\Services\FrontendUrlService;
use App\Services\PermissionSyncService;
use App\Services\TenantInvitationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Notification;

class UserController extends Controller
{
  use AuthorizesPermissions;

  public function index(Request $request): AnonymousResourceCollection
  {
    $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
    $search = trim((string) $request->query('search', ''));

    $users = User::query()
      ->where('tenant_id', $request->user()->tenant_id)
      ->where('is_support', false)
      ->with('profile', 'latestInvitation')
      ->when($search !== '', function ($query) use ($search): void {
        $query->where(function ($query) use ($search): void {
          $query->where('name', 'like', "%{$search}%")
            ->orWhere('email', 'like', "%{$search}%");
        });
      })
      ->when(
        $request->filled('role'),
        fn ($query) => $query->where('role', $request->string('role')->toString()),
      )
      ->when(
        $request->filled('permission_profile_id'),
        fn ($query) => $query->where('permission_profile_id', $request->integer('permission_profile_id')),
      )
      ->latest()
      ->paginate($perPage)
      ->withQueryString();

    return UserResource::collection($users);
  }

  public function store(
    StoreUserRequest $request,
    PermissionSyncService $permissions,
    TenantInvitationService $invitations,
    FrontendUrlService $frontends,
  ): JsonResponse {
    $data = $request->validated();
    $role = UserRole::from($data['role']);
    $rolePermissions = $role->permissions();
    $this->ensureCanGrant($request, [...$rolePermissions, ...($data['extra_permissions'] ?? [])]);
    $this->ensureCanAssignProfile($request, $data['permission_profile_id'] ?? null);

    $invite = $request->boolean('invite');

    $user = new User([
      'name' => $data['name'],
      'email' => $data['email'],
      'password' => $invite ? null : ($data['password'] ?? null),
      'role' => $role,
      'permission_profile_id' => $data['permission_profile_id'] ?? null,
      'extra_permissions' => $data['extra_permissions'] ?? [],
    ]);
    $user->tenant_id = $request->user()->tenant_id;
    $user->is_support = false;
    $user->permissions = [];
    $user->save();

    $permissions->sync($user);

    $additional = [];

    if ($invite) {
      $result = $invitations->create($user);

      Notification::route('mail', $user->email)
        ->notify(new TenantInvitationNotification($result['invitation'], $result['token'], $frontends));

      $additional['invitation'] = [
        'expires_at' => $result['invitation']->expires_at?->toIso8601String(),
      ];

      if (app()->environment(['local', 'testing'])) {
        $additional['invitation']['token'] = $result['token'];
      }
    }

    return (new UserResource($user->load('profile', 'latestInvitation')))
      ->additional($additional)
      ->response()
      ->setStatusCode(201);
  }

  public function show(Request $request, User $user): UserResource
  {
    $this->ensureTenantUser($request, $user);

    return new UserResource($user->load('profile', 'latestInvitation'));
  }

  public function update(
    UpdateUserRequest $request,
    User $user,
    PermissionSyncService $permissions,
  ): UserResource {
    $this->ensureTenantUser($request, $user);
    $data = $request->validated();

    if (array_key_exists('password', $data) && blank($data['password'])) {
      unset($data['password']);
    }

    unset($data['password_confirmation']);

    if ($user->id === $request->user()->id && isset($data['role']) && $data['role'] !== $user->role?->value) {
      abort(422, 'You cannot change your own role.');
    }

    if ($user->is_tenant_owner && isset($data['role']) && $data['role'] !== UserRole::Admin->value) {
      abort(422, 'The tenant owner role cannot be changed.');
    }

    if (isset($data['role'])) {
      $this->ensureCanGrant($request, UserRole::from($data['role'])->permissions());
    }

    if (isset($data['extra_permissions'])) {
      $this->ensureCanGrant($request, $data['extra_permissions']);
    }

    if (array_key_exists('permission_profile_id', $data)) {
      $this->ensureCanAssignProfile($request, $data['permission_profile_id']);
    }

    $user->fill($data);
    $user->save();
    $permissions->sync($user);

    return new UserResource($user->load('profile', 'latestInvitation'));
  }

  public function destroy(Request $request, User $user): Response
  {
    $this->ensureTenantUser($request, $user);
    abort_if($user->id === $request->user()->id, 422, 'You cannot delete yourself.');
    abort_if($user->is_tenant_owner, 422, 'The tenant owner cannot be deleted.');

    if ($user->role === UserRole::Admin && ! $request->user()->is_tenant_owner) {
      abort(403, 'Only the tenant owner can delete an admin.');
    }

    $user->delete();

    return response()->noContent();
  }

  public function invite(
    Request $request,
    User $user,
    TenantInvitationService $invitations,
    FrontendUrlService $frontends,
  ): JsonResponse {
    $this->ensureTenantUser($request, $user);
    abort_if($user->password !== null, 422, 'This user has already accepted the invitation.');

    $result = $invitations->create($user);

    Notification::route('mail', $user->email)
      ->notify(new TenantInvitationNotification($result['invitation'], $result['token'], $frontends));

    $payload = [
      'message' => 'Invitation sent.',
      'invitation' => [
        'expires_at' => $result['invitation']->expires_at?->toIso8601String(),
      ],
    ];

    if (app()->environment(['local', 'testing'])) {
      $payload['invitation']['token'] = $result['token'];
    }

    return response()->json($payload);
  }

  private function ensureTenantUser(Request $request, User $user): void
  {
    abort_unless($user->tenant_id === $request->user()->tenant_id && ! $user->is_support, 404);
  }

  private function ensureCanAssignProfile(Request $request, ?int $profileId): void
  {
    if ($profileId === null) {
      return;
    }

    $profile = PermissionProfile::query()->findOrFail($profileId);
    abort_unless($profile->tenant_id === $request->user()->tenant_id, 404);
    $this->ensureCanGrant($request, $profile->permissions ?? []);
  }
}
