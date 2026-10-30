<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\StoreTenantRequest;
use App\Http\Requests\Owner\UpdateTenantRequest;
use App\Http\Resources\TenantDetailResource;
use App\Http\Resources\TenantPurgeResource;
use App\Http\Resources\TenantResource;
use App\Http\Resources\UserResource;
use App\Models\Owner;
use App\Models\Tenant;
use App\Models\TenantPurge;
use App\Notifications\TenantInvitationNotification;
use App\Services\FrontendUrlService;
use App\Services\TenantProvisioningService;
use App\Services\TenantPurgeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Notification;

class TenantController extends Controller
{
  public function index(Request $request): AnonymousResourceCollection
  {
    $owner = $this->currentOwner($request);

    $state = (string) $request->query('state', 'active');
    $search = trim((string) $request->query('search', ''));
    $perPage = min(max((int) $request->query('per_page', 15), 1), 100);

    $tenants = Tenant::query()
      ->where('owner_id', $owner->id)
      ->when($state === 'trashed', fn ($query) => $query->onlyTrashed())
      ->when($state === 'all', fn ($query) => $query->withTrashed())
      ->when($search !== '', function ($query) use ($search): void {
        $query->where(function ($query) use ($search): void {
          $query->where('name', 'like', "%{$search}%")
            ->orWhere('category', 'like', "%{$search}%");
        });
      })
      ->when(
        $request->filled('category'),
        fn ($query) => $query->where('category', $request->query('category')),
      )
      ->when(
        $request->filled('allow_support'),
        fn ($query) => $query->where('allow_support', $request->boolean('allow_support')),
      )
      ->when(
        $request->filled('is_due'),
        fn ($query) => $query->where('is_due', $request->boolean('is_due')),
      )
      ->latest()
      ->paginate($perPage)
      ->withQueryString();

    return TenantResource::collection($tenants);
  }

  public function store(StoreTenantRequest $request, TenantProvisioningService $provisioning, FrontendUrlService $frontends): JsonResponse
  {
    $owner = $this->currentOwner($request);

    $result = $provisioning->provision($owner, $request->validated());

    Notification::route('mail', $result['admin']->email)
      ->notify(new TenantInvitationNotification($result['invitation'], $result['token'], $frontends));

    $additional = [
      'admin' => new UserResource($result['admin']->load('profile')),
      'invitation' => [
        'expires_at' => $result['invitation']->expires_at?->toIso8601String(),
      ],
    ];

    if (app()->environment(['local', 'testing'])) {
      $additional['invitation']['token'] = $result['token'];
    }

    return (new TenantResource($result['tenant']))
      ->additional($additional)
      ->response()
      ->setStatusCode(201);
  }

  public function show(Request $request, Tenant $tenant): TenantDetailResource
  {
    $this->ensureOwned($request, $tenant);

    $tenant->load(['admin', 'latestInvitation', 'subscription.plan'])
      ->loadCount(['users', 'posts']);

    return new TenantDetailResource($tenant);
  }

  public function update(UpdateTenantRequest $request, Tenant $tenant): TenantResource
  {
    $this->ensureOwned($request, $tenant);
    $tenant->update($request->validated());

    return new TenantResource($tenant);
  }

  public function destroy(Request $request, Tenant $tenant): Response
  {
    $this->ensureOwned($request, $tenant);
    $tenant->delete();

    return response()->noContent();
  }

  public function restore(Request $request, Tenant $tenant): TenantResource
  {
    $this->ensureOwned($request, $tenant);
    $tenant->restore();

    return new TenantResource($tenant);
  }

  public function forceDelete(Request $request, Tenant $tenant, TenantPurgeService $purgeService): Response
  {
    $this->ensureOwned($request, $tenant);

    abort_unless($tenant->trashed(), 422, 'Only trashed tenants can be permanently deleted.');

    $owner = $this->currentOwner($request);

    $purgeService->purge($tenant, $owner);

    return response()->noContent();
  }

  public function purged(Request $request): AnonymousResourceCollection
  {
    $owner = $this->currentOwner($request);

    $purges = TenantPurge::query()
      ->where('owner_id', $owner->id)
      ->latest('purged_at')
      ->paginate(15)
      ->withQueryString();

    return TenantPurgeResource::collection($purges);
  }

  private function ensureOwned(Request $request, Tenant $tenant): void
  {
    abort_unless($tenant->owner_id === $this->currentOwner($request)->id, 404);
  }

  private function currentOwner(Request $request): Owner
  {
    $owner = $request->user('owner');

    if (! $owner instanceof Owner) {
      abort(401);
    }

    return $owner;
  }
}
