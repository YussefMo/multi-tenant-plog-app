<?php

use App\Http\Controllers\Api\Owner\BillingController as OwnerBillingController;
use App\Http\Controllers\Api\Owner\OwnerAuthController;
use App\Http\Controllers\Api\Owner\PlanController;
use App\Http\Controllers\Api\Owner\SupportAccessController;
use App\Http\Controllers\Api\Owner\TenantController;
use App\Http\Controllers\Api\StripeWebhookController;
use App\Http\Controllers\Api\Tenant\AuthController;
use App\Http\Controllers\Api\Tenant\BillingController;
use App\Http\Controllers\Api\Tenant\BillingRedirectController;
use App\Http\Controllers\Api\Tenant\PermissionCatalogController;
use App\Http\Controllers\Api\Tenant\PermissionProfileController;
use App\Http\Controllers\Api\Tenant\PostController;
use App\Http\Controllers\Api\Tenant\TenantDirectoryController;
use App\Http\Controllers\Api\Tenant\TenantOverviewController;
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

      Route::patch('/auth/profile', [OwnerAuthController::class, 'updateProfile'])
        ->name('api.v1.owner.profile');
      Route::put('/auth/password', [OwnerAuthController::class, 'updatePassword'])
        ->name('api.v1.owner.password');

      Route::get('/tenants/purged', [TenantController::class, 'purged'])
        ->name('api.v1.owner.tenants.purged');

      Route::delete('/tenants/{tenant}/force', [TenantController::class, 'forceDelete'])
        ->withTrashed()
        ->name('api.v1.owner.tenants.force-delete');

      Route::apiResource('tenants', TenantController::class)
        ->except(['create', 'edit'])
        ->names('api.v1.owner.tenants');

      Route::apiResource('plans', PlanController::class)
        ->except(['create', 'edit'])
        ->names('api.v1.owner.plans');

      Route::get('/billing/metrics', [OwnerBillingController::class, 'metrics'])
        ->name('api.v1.owner.billing.metrics');
      Route::get('/billing/transactions', [OwnerBillingController::class, 'transactions'])
        ->name('api.v1.owner.billing.transactions');

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

      Route::patch('/profile', [AuthController::class, 'updateProfile'])
        ->middleware(['support', 'tenant.active'])
        ->name('api.v1.auth.profile');
      Route::put('/password', [AuthController::class, 'updatePassword'])
        ->middleware(['support', 'tenant.active'])
        ->name('api.v1.auth.password');
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

  Route::get('/billing/checkout/success', [BillingRedirectController::class, 'success'])
    ->name('api.v1.billing.checkout.success');
  Route::get('/billing/checkout/cancel', [BillingRedirectController::class, 'cancel'])
    ->name('api.v1.billing.checkout.cancel');
  Route::get('/billing/portal/return', [BillingRedirectController::class, 'portalReturn'])
    ->name('api.v1.billing.portal.return');

  Route::post('/stripe/webhook', StripeWebhookController::class)
    ->name('api.v1.stripe.webhook');

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
    Route::get('/tenant/overview', [TenantOverviewController::class, 'show'])
      ->name('api.v1.tenant.overview');

    Route::get('/permissions', [PermissionCatalogController::class, 'index'])
      ->middleware('permission:users.view,profiles.view')
      ->name('api.v1.permissions.index');

    Route::prefix('billing')->group(function () {
      Route::get('/plans', [BillingController::class, 'plans'])
        ->middleware('permission:billing.view')
        ->name('api.v1.billing.plans');
      Route::get('/subscription', [BillingController::class, 'subscription'])
        ->middleware('permission:billing.view')
        ->name('api.v1.billing.subscription');
      Route::get('/invoices', [BillingController::class, 'invoices'])
        ->middleware('permission:billing.view')
        ->name('api.v1.billing.invoices');
      Route::get('/payments', [BillingController::class, 'payments'])
        ->middleware('permission:billing.view')
        ->name('api.v1.billing.payments');
      Route::post('/checkout', [BillingController::class, 'checkout'])
        ->middleware('permission:billing.manage')
        ->name('api.v1.billing.checkout');
      Route::post('/portal', [BillingController::class, 'portal'])
        ->middleware('permission:billing.manage')
        ->name('api.v1.billing.portal');
      Route::post('/cancel', [BillingController::class, 'cancel'])
        ->middleware('permission:billing.manage')
        ->name('api.v1.billing.cancel');
    });

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
    Route::post('/users/{user}/invite', [UserController::class, 'invite'])
      ->middleware('permission:users.update')
      ->name('api.v1.users.invite');

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
