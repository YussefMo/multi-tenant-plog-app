<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateTenantSettingsRequest;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use Illuminate\Http\Request;

class TenantSettingsController extends Controller
{
  public function show(Request $request): TenantResource
  {
    $tenant = $request->user()->tenant;
    abort_unless($tenant instanceof Tenant, 404);

    return new TenantResource($tenant);
  }

  public function update(UpdateTenantSettingsRequest $request): TenantResource
  {
    $tenant = $request->user()->tenant;
    abort_unless($tenant instanceof Tenant, 404);

    $tenant->update($request->validated());

    return new TenantResource($tenant);
  }
}
