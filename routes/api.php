<?php

use App\Http\Controllers\Api\Owner\OwnerAuthController;
use App\Http\Controllers\Api\Owner\SupportAccessController;
use App\Http\Controllers\Api\Owner\TenantController;
use App\Http\Controllers\Api\Tenant\AuthController;
use App\Http\Controllers\Api\Tenant\PermissionProfileController;
use App\Http\Controllers\Api\Tenant\PostController;
use App\Http\Controllers\Api\Tenant\TenantDirectoryController;
use App\Http\Controllers\Api\Tenant\TenantSettingsController;
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

      Route::post('/tenants/{tenant}/access', [SupportAccessController::class, 'store'])
        ->withTrashed()
        ->name('api.v1.owner.tenants.access');

      Route::post('/tenants/{tenant}/restore', [TenantController::class, 'restore'])
        ->withTrashed()
        ->name('api.v1.owner.tenants.restore');
    });
  });

  Route::prefix('auth')->middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])
      ->name('api.v1.auth.login');

    Route::post('/register', [AuthController::class, 'register'])
      ->middleware('throttle:10,1')
      ->name('api.v1.auth.register');

    Route::post('/accept-invitation', [AuthController::class, 'acceptInvitation'])
      ->name('api.v1.auth.accept-invitation');

    Route::post('/support-login', [AuthController::class, 'supportLogin'])
      ->name('api.v1.auth.support-login');

    Route::middleware('auth:web')->group(function () {
      Route::post('/logout', [AuthController::class, 'logout'])
        ->name('api.v1.auth.logout');

      Route::post('/support/end', [AuthController::class, 'supportEnd'])
        ->name('api.v1.auth.support-end');

      Route::get('/me', [AuthController::class, 'me'])
        ->middleware(['support', 'tenant.active'])
        ->name('api.v1.auth.me');
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

  Route::middleware(['web', 'auth:web', 'support', 'tenant.active'])->group(function () {
    Route::get('/user', fn (Request $request) => new UserResource($request->user()->load('tenant', 'profile')))
      ->name('api.v1.user');

    Route::get('/tenants', [TenantDirectoryController::class, 'index'])
      ->middleware('permission:tenants.view')
      ->name('api.v1.tenants.index');
    Route::get('/tenants/{tenant}/posts', [TenantDirectoryController::class, 'posts'])
      ->middleware('permission:tenants.view')
      ->name('api.v1.tenants.posts');

    Route::get('/tenant', [TenantSettingsController::class, 'show'])
      ->middleware('permission:tenant.settings.view')
      ->name('api.v1.tenant.show');
    Route::patch('/tenant', [TenantSettingsController::class, 'update'])
      ->middleware('permission:tenant.settings.update')
      ->name('api.v1.tenant.update');

    Route::get('/posts', [PostController::class, 'index'])
      ->middleware('permission:posts.view.any,posts.view.own,posts.view.published')
      ->name('api.v1.posts.index');
    Route::post('/posts', [PostController::class, 'store'])
      ->middleware('permission:posts.create')
      ->name('api.v1.posts.store');
    Route::get('/posts/{post}', [PostController::class, 'show'])
      ->middleware('permission:posts.view.any,posts.view.own,posts.view.published')
      ->name('api.v1.posts.show');
    Route::patch('/posts/{post}', [PostController::class, 'update'])
      ->middleware('permission:posts.update.any,posts.update.own')
      ->name('api.v1.posts.update');
    Route::delete('/posts/{post}', [PostController::class, 'destroy'])
      ->middleware('permission:posts.delete.any,posts.delete.own')
      ->name('api.v1.posts.destroy');
    Route::post('/posts/{post}/publish', [PostController::class, 'publish'])
      ->middleware('permission:posts.publish')
      ->name('api.v1.posts.publish');
    Route::post('/posts/{post}/unpublish', [PostController::class, 'unpublish'])
      ->middleware('permission:posts.publish')
      ->name('api.v1.posts.unpublish');

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
