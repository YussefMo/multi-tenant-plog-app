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
use App\Services\PermissionSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class UserController extends Controller
{
  use AuthorizesPermissions;

  public function index(Request $request): AnonymousResourceCollection
  {
    $users = User::query()
      ->where('tenant_id', $request->user()->tenant_id)
      ->where('is_support', false)
      ->with('profile')
      ->latest()
      ->paginate(15);

    return UserResource::collection($users);
  }

  public function store(StoreUserRequest $request, PermissionSyncService $permissions): JsonResponse
  {
    $data = $request->validated();
    $role = UserRole::from($data['role']);
    $rolePermissions = $role->permissions();
    $this->ensureCanGrant($request, [...$rolePermissions, ...($data['extra_permissions'] ?? [])]);
    $this->ensureCanAssignProfile($request, $data['permission_profile_id'] ?? null);

    $user = new User($data);
    $user->tenant_id = $role === UserRole::User ? null : $request->user()->tenant_id;

    if ($role === UserRole::User) {
      $user->permission_profile_id = null;
    }

    $user->is_support = false;
    $user->permissions = [];
    $user->save();

    $permissions->sync($user);

    return (new UserResource($user->load('profile')))->response()->setStatusCode(201);
  }

  public function show(Request $request, User $user): UserResource
  {
    $this->ensureTenantUser($request, $user);

    return new UserResource($user->load('profile'));
  }

  public function update(UpdateUserRequest $request, User $user, PermissionSyncService $permissions): UserResource
  {
    $this->ensureTenantUser($request, $user);
    $data = $request->validated();

    if ($user->id === $request->user()->id && isset($data['role']) && $data['role'] !== $user->role?->value) {
      abort(422, 'You cannot change your own role.');
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

    return new UserResource($user->load('profile'));
  }

  public function destroy(Request $request, User $user): Response
  {
    $this->ensureTenantUser($request, $user);
    abort_if($user->id === $request->user()->id, 422, 'You cannot delete yourself.');

    $user->delete();

    return response()->noContent();
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
