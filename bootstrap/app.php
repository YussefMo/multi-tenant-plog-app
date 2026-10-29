<?php

use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsureSupportAccess;
use App\Http\Middleware\EnsureTenantActive;
use App\Http\Middleware\ForceJsonResponse;
use App\Http\Middleware\ResolveSessionRealm;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
  ->withRouting(
    web: __DIR__.'/../routes/web.php',
    api: __DIR__.'/../routes/api.php',
    commands: __DIR__.'/../routes/console.php',
    health: '/up',
  )
  ->withMiddleware(function (Middleware $middleware): void {
    $middleware->prepend(ResolveSessionRealm::class);

    $middleware->api(prepend: [
      ForceJsonResponse::class,
    ]);

    $middleware->alias([
      'permission' => EnsurePermission::class,
      'support' => EnsureSupportAccess::class,
      'tenant.active' => EnsureTenantActive::class,
    ]);
  })
  ->withExceptions(function (Exceptions $exceptions): void {
    $exceptions->shouldRenderJsonWhen(
      fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
    );

    $exceptions->render(function (Throwable $exception, Request $request) {
      if ((! $request->is('api/*') && ! $request->expectsJson()) || $exception instanceof HttpResponseException) {
        return null;
      }

      $status = match (true) {
        $exception instanceof ValidationException => 422,
        $exception instanceof AuthenticationException => 401,
        $exception instanceof AuthorizationException => 403,
        $exception instanceof ModelNotFoundException => 404,
        $exception instanceof HttpExceptionInterface => $exception->getStatusCode(),
        default => 500,
      };

      $message = $exception->getMessage();
      $message = $message !== '' ? $message : match ($status) {
        401 => 'Unauthenticated.',
        403 => 'Forbidden.',
        404 => 'Not Found.',
        419 => 'CSRF token mismatch.',
        422 => 'The given data was invalid.',
        500 => 'Server Error.',
        default => 'Error.',
      };

      $payload = [
        'message' => $status >= 500 && ! config('app.debug') ? 'Server Error.' : $message,
        'status' => $status,
      ];

      if ($exception instanceof ValidationException) {
        $payload['errors'] = $exception->errors();
      }

      return response()->json($payload, $status);
    });
  })->create();
