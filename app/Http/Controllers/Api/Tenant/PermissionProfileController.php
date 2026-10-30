<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Concerns\AuthorizesPermissions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StorePermissionProfileRequest;
use App\Http\Requests\Tenant\UpdatePermissionProfileRequest;
use App\Http\Resources\PermissionProfileResource;
use App\Models\PermissionProfile;
use App\Services\PermissionSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class PermissionProfileController extends Controller
{
  use AuthorizesPermissions;

  public function index(Request $request): AnonymousResourceCollection
  {
    $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
    $search = trim((string) $request->query('search', ''));

    $profiles = PermissionProfile::query()
      ->where('tenant_id', $request->user()->tenant_id)
      ->withCount(['users' => fn ($query) => $query->where('is_support', false)])
      ->when($search !== '', function ($query) use ($search): void {
        $query->where(function ($query) use ($search): void {
          $query->where('name', 'like', "%{$search}%")
            ->orWhere('description', 'like', "%{$search}%");
        });
      })
      ->latest()
      ->paginate($perPage)
      ->withQueryString();

    return PermissionProfileResource::collection($profiles);
  }

  public function store(StorePermissionProfileRequest $request): JsonResponse
  {
    $data = $request->validated();
    $this->ensureCanGrant($request, $data['permissions']);

    $profile = new PermissionProfile($data);
    $profile->tenant_id = $request->user()->tenant_id;
    $profile->save();

    return (new PermissionProfileResource($profile->loadCount([
      'users' => fn ($query) => $query->where('is_support', false),
    ])))->response()->setStatusCode(201);
  }

  public function show(Request $request, PermissionProfile $profile): PermissionProfileResource
  {
    $this->ensureTenantProfile($request, $profile);

    return new PermissionProfileResource($profile->loadCount([
      'users' => fn ($query) => $query->where('is_support', false),
    ]));
  }

  public function update(
    UpdatePermissionProfileRequest $request,
    PermissionProfile $profile,
    PermissionSyncService $permissions,
  ): PermissionProfileResource {
    $this->ensureTenantProfile($request, $profile);
    $data = $request->validated();

    if (isset($data['permissions'])) {
      $this->ensureCanGrant($request, $data['permissions']);
    }

    $profile->fill($data);
    $profile->save();
    $permissions->syncUsersForProfile($profile);

    return new PermissionProfileResource($profile->loadCount([
      'users' => fn ($query) => $query->where('is_support', false),
    ]));
  }

  public function destroy(Request $request, PermissionProfile $profile): Response
  {
    $this->ensureTenantProfile($request, $profile);
    abort_if($profile->users()->exists(), 409, 'Profile is assigned to users.');

    $profile->delete();

    return response()->noContent();
  }

  private function ensureTenantProfile(Request $request, PermissionProfile $profile): void
  {
    abort_unless($profile->tenant_id === $request->user()->tenant_id, 404);
  }
}
