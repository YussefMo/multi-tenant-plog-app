<?php

namespace Tests\Feature;

use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Support\Str;
use Tests\TestCase;

class CsrfProtectionTest extends TestCase
{
  public function test_every_state_changing_api_route_runs_the_csrf_middleware(): void
  {
    $router = app('router');

    $mutating = collect($router->getRoutes()->getRoutes())
      ->filter(fn ($route): bool => Str::startsWith($route->uri(), 'api/'))
      ->filter(fn ($route): bool => array_intersect($route->methods(), ['POST', 'PUT', 'PATCH', 'DELETE']) !== [])
      ->mapWithKeys(fn ($route): array => [$route->uri() => $route->gatherMiddleware()]);

    $webhook = 'api/v1/stripe/webhook';

    $this->assertNotEmpty($mutating);
    $this->assertArrayHasKey($webhook, $mutating);
    $this->assertNotContains(
      'web',
      $mutating[$webhook],
      'The Stripe webhook cannot use CSRF; it must rely on signature verification.',
    );

    $mutating->except($webhook)->each(function (array $middleware, string $uri): void {
      $this->assertContains(
        'web',
        $middleware,
        "State-changing route [{$uri}] must run the CSRF-protected web middleware group.",
      );
    });
  }

  public function test_csrf_rejects_a_post_without_a_token(): void
  {
    $this->withoutCsrfTestBypass();

    $this->postJson('/api/v1/auth/login', [
      'email' => 'user@example.test',
      'password' => 'password',
    ])
      ->assertStatus(419)
      ->assertJsonPath('status', 419);
  }

  public function test_csrf_accepts_a_post_with_the_session_token(): void
  {
    $this->withoutCsrfTestBypass();

    $this->withSession(['_token' => 'session-csrf-token'])
      ->withHeader('X-CSRF-TOKEN', 'session-csrf-token')
      ->postJson('/api/v1/auth/login', [])
      ->assertStatus(422)
      ->assertJsonValidationErrors(['email', 'password']);
  }

  /**
   * Laravel skips CSRF verification while running the test suite. Bind a middleware
   * without that bypass so the real request pipeline is exercised.
   */
  private function withoutCsrfTestBypass(): void
  {
    $this->app->instance(PreventRequestForgery::class, new class ($this->app, $this->app['encrypter']) extends PreventRequestForgery {
      protected function runningUnitTests()
      {
        return false;
      }
    });
  }
}
