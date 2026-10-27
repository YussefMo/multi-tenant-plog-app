<?php

use App\Http\Controllers\Api\Owner\OwnerAuthController;
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
    Route::get('/user', fn (Request $request) => $request->user())
      ->name('api.v1.user');
  });
});
