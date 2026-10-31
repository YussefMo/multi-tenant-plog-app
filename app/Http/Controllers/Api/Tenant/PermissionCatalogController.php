<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Endpoint;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;

#[Group('Permissions', description: 'Permission catalog used by tenant forms.')]
class PermissionCatalogController extends Controller
{
  #[Endpoint(title: 'Permission catalog', description: 'Return the grouped permission catalog and role presets.')]
  public function index(): JsonResponse
  {
    return response()->json([
      'data' => [
        'catalog' => array_values((array) config('permissions.catalog', [])),
        'presets' => (array) config('permissions.presets', []),
      ],
    ]);
  }
}
