<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateTenantSettingsRequest;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;

#[Group('Tenant settings', description: 'Tenant profile and settings.')]
class TenantSettingsController extends Controller
{
  #[Endpoint(title: 'Show tenant settings', description: 'Return the current tenant profile and settings.')]
  public function show(Request $request): TenantResource
  {
    $tenant = $request->user()->tenant;
    abort_unless($tenant instanceof Tenant, 404);

    return new TenantResource($tenant);
  }

  #[Endpoint(title: 'Update tenant settings', description: 'Update tenant name, category, and support access.')]
  public function update(UpdateTenantSettingsRequest $request): TenantResource
  {
    $tenant = $request->user()->tenant;
    abort_unless($tenant instanceof Tenant, 404);

    $tenant->update($request->validated());

    return new TenantResource($tenant);
  }
}
