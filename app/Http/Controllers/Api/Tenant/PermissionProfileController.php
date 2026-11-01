<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Concerns\AuthorizesPermissions;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StorePermissionProfileRequest;
use App\Http\Requests\Tenant\UpdatePermissionProfileRequest;
use App\Http\Resources\PermissionProfileResource;
use App\Models\PermissionProfile;
use App\Services\PermissionSyncService;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

#[Group('Permission profiles', description: 'Tenant permission profile CRUD and resync.')]
class PermissionProfileController extends Controller
{
  use AuthorizesPermissions;

  #[Endpoint(title: 'List profiles', description: 'List tenant permission profiles with search and pagination.')]
  public function index(Request $request): AnonymousResourceCollection
  {
    $perPage = min(max((int) $request->query('per_page', 15), 1), 100);
    $search = trim((string) $request->query('search', ''));

    $profiles = PermissionProfile::query()
      ->where('tenant_id', $request->user()->tenant_id)
      ->withCount(['users' => fn ($query) => $query->where('is_support', false)])
      ->when($search !== '', function ($query) use ($search): void {
        $query->where(function ($query) use ($search): void {
          $query->whereLike('name', "%{$search}%")
            ->orWhereLike('description', "%{$search}%");
        });
      })
      ->latest()
      ->paginate($perPage)
      ->withQueryString();

    return PermissionProfileResource::collection($profiles);
  }

  #[Endpoint(title: 'Create profile', description: 'Create a tenant permission profile.')]
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

  #[Endpoint(title: 'Show profile', description: 'Return one tenant permission profile.')]
  public function show(Request $request, PermissionProfile $profile): PermissionProfileResource
  {
    $this->ensureTenantProfile($request, $profile);

    return new PermissionProfileResource($profile->loadCount([
      'users' => fn ($query) => $query->where('is_support', false),
    ]));
  }

  #[Endpoint(title: 'Update profile', description: 'Update a profile and resync assigned users.')]
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

  #[Endpoint(title: 'Delete profile', description: 'Delete an unused profile; reject assigned profiles.')]
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
