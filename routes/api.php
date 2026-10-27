<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
  Route::get('/health', function () {
    return response()->json([
      'status' => 'ok',
      'app' => config('app.name'),
      'version' => 'v1',
      'timestamp' => now()->toIso8601String(),
    ]);
  })->name('api.v1.health');

  Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
      return $request->user();
    })->name('api.v1.user');
  });
});
