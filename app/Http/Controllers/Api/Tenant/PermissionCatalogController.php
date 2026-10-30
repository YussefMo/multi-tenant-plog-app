<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class PermissionCatalogController extends Controller
{
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
