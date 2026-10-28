<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\StoreTenantRequest;
use App\Http\Requests\Owner\UpdateTenantRequest;
use App\Http\Resources\TenantResource;
use App\Http\Resources\UserResource;
use App\Models\Owner;
use App\Models\Tenant;
use App\Notifications\TenantInvitationNotification;
use App\Services\TenantProvisioningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Notification;

class TenantController extends Controller
{
  public function index(Request $request): AnonymousResourceCollection
  {
    $tenants = Tenant::query()
      ->where('owner_id', $request->user('owner')->id)
      ->latest()
      ->paginate(15);

    return TenantResource::collection($tenants);
  }

  public function store(StoreTenantRequest $request, TenantProvisioningService $provisioning): JsonResponse
  {
    $owner = $request->user('owner');
    abort_unless($owner instanceof Owner, 401);

    $result = $provisioning->provision($owner, $request->validated());

    Notification::route('mail', $result['admin']->email)
      ->notify(new TenantInvitationNotification($result['invitation'], $result['token']));

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

  public function show(Request $request, Tenant $tenant): TenantResource
  {
    $this->ensureOwned($request, $tenant);

    return new TenantResource($tenant);
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

  private function ensureOwned(Request $request, Tenant $tenant): void
  {
    abort_unless($tenant->owner_id === $request->user('owner')?->id, 404);
  }
}
