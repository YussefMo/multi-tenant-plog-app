<?php

use App\Http\Controllers\Api\Owner\OwnerAuthController;
use App\Http\Controllers\Api\Owner\TenantController;
use App\Http\Controllers\Api\Tenant\PermissionProfileController;
use App\Http\Controllers\Api\Tenant\UserController;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
  Route::middleware('web')->get('/csrf-token', fn () => response()->json(['csrf_token' => csrf_token()]))
    ->name('api.v1.csrf-token');

  Route::prefix('owner')->middleware('web')->group(function () {
    Route::get('/csrf-token', fn () => response()->json(['csrf_token' => csrf_token()]))
      ->name('api.v1.owner.csrf-token');

    Route::post('/auth/login', [OwnerAuthController::class, 'login'])
      ->name('api.v1.owner.login');

    Route::middleware('auth:owner')->group(function () {
      Route::post('/auth/logout', [OwnerAuthController::class, 'logout'])
        ->name('api.v1.owner.logout');

      Route::get('/auth/me', [OwnerAuthController::class, 'me'])
        ->name('api.v1.owner.me');

      Route::apiResource('tenants', TenantController::class)
        ->except(['create', 'edit'])
        ->names('api.v1.owner.tenants');

      Route::post('/tenants/{tenant}/restore', [TenantController::class, 'restore'])
        ->withTrashed()
        ->name('api.v1.owner.tenants.restore');
    });
  });

  Route::get('/health', function () {
    return response()->json([
      'status' => 'ok',
      'app' => config('app.name'),
      'version' => 'v1',
      'timestamp' => now()->toIso8601String(),
    ]);
  })->name('api.v1.health');

  Route::middleware(['web', 'auth:web'])->group(function () {
    Route::get('/user', fn (Request $request) => new UserResource($request->user()->load('profile')))
      ->name('api.v1.user');

    Route::get('/users', [UserController::class, 'index'])
      ->middleware('permission:users.view')
      ->name('api.v1.users.index');
    Route::post('/users', [UserController::class, 'store'])
      ->middleware('permission:users.create')
      ->name('api.v1.users.store');
    Route::get('/users/{user}', [UserController::class, 'show'])
      ->middleware('permission:users.view')
      ->name('api.v1.users.show');
    Route::patch('/users/{user}', [UserController::class, 'update'])
      ->middleware('permission:users.update')
      ->name('api.v1.users.update');
    Route::delete('/users/{user}', [UserController::class, 'destroy'])
      ->middleware('permission:users.delete')
      ->name('api.v1.users.destroy');

    Route::get('/profiles', [PermissionProfileController::class, 'index'])
      ->middleware('permission:profiles.view')
      ->name('api.v1.profiles.index');
    Route::post('/profiles', [PermissionProfileController::class, 'store'])
      ->middleware('permission:profiles.create')
      ->name('api.v1.profiles.store');
    Route::get('/profiles/{profile}', [PermissionProfileController::class, 'show'])
      ->middleware('permission:profiles.view')
      ->name('api.v1.profiles.show');
    Route::patch('/profiles/{profile}', [PermissionProfileController::class, 'update'])
      ->middleware('permission:profiles.update')
      ->name('api.v1.profiles.update');
    Route::delete('/profiles/{profile}', [PermissionProfileController::class, 'destroy'])
      ->middleware('permission:profiles.delete')
      ->name('api.v1.profiles.destroy');
  });
});
