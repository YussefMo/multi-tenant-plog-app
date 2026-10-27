<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Http\Requests\Owner\StoreTenantRequest;
use App\Http\Requests\Owner\UpdateTenantRequest;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

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

  public function store(StoreTenantRequest $request): JsonResponse
  {
    $tenant = new Tenant($request->validated());
    $tenant->owner_id = $request->user('owner')->id;
    $tenant->save();

    return (new TenantResource($tenant))->response()->setStatusCode(201);
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
