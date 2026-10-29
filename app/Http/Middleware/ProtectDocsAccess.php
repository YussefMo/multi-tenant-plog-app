<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ProtectDocsAccess
{
  public function handle(Request $request, Closure $next): Response
  {
    $username = (string) config('scramble.auth.username', '');
    $password = (string) config('scramble.auth.password', '');

    if ($username === '' || $password === '') {
      return response()->json([
        'message' => 'API docs credentials are not configured.',
        'status' => 503,
      ], 503);
    }

    $providedUsername = $request->getUser();
    $providedPassword = $request->getPassword();

    $usernameMatches = is_string($providedUsername) && hash_equals($username, $providedUsername);
    $passwordMatches = is_string($providedPassword) && hash_equals($password, $providedPassword);

    if (! $usernameMatches || ! $passwordMatches) {
      return response()->json([
        'message' => 'Authentication required.',
        'status' => 401,
      ], 401, [
        'WWW-Authenticate' => 'Basic realm="API Docs"',
      ]);
    }

    return $next($request);
  }
}
