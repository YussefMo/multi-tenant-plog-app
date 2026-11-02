<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiDocsTest extends TestCase
{
  protected function setUp(): void
  {
    parent::setUp();

    config([
      'scramble.auth.username' => 'docs',
      'scramble.auth.password' => 'secret',
    ]);
  }

  public function test_docs_require_basic_auth(): void
  {
    $this->getJson('/docs/api.json')->assertUnauthorized();

    $this->get('/docs/api')
      ->assertUnauthorized()
      ->assertHeader('WWW-Authenticate', 'Basic realm="API Docs"');
  }

  public function test_docs_reject_wrong_credentials(): void
  {
    $this->withHeaders([
      'Authorization' => 'Basic '.base64_encode('docs:wrong-password'),
    ])
      ->get('/docs/api')
      ->assertUnauthorized();
  }

  public function test_docs_are_readable_without_credentials_when_public_mode_is_enabled(): void
  {
    config(['scramble.public' => true]);

    $this->get('/docs/api')
      ->assertOk()
      ->assertSee('Multi Tenant Plog API', false);

    $this->getJson('/docs/api.json')
      ->assertOk()
      ->assertJsonPath('openapi', '3.1.2');

    $this->getJson('/api/v1/tenants')->assertUnauthorized();
  }

  public function test_public_mode_does_not_bypass_basic_auth_when_it_is_disabled(): void
  {
    config(['scramble.public' => false]);

    $this->get('/docs/api')->assertUnauthorized();
  }

  public function test_docs_report_misconfiguration_when_credentials_are_missing(): void
  {
    config([
      'scramble.public' => false,
      'scramble.auth.username' => null,
      'scramble.auth.password' => null,
    ]);

    $this->getJson('/docs/api.json')
      ->assertStatus(503)
      ->assertJsonPath('status', 503);
  }

  public function test_openapi_docs_are_available_with_basic_auth(): void
  {
    $this->withDocsAuth()
      ->get('/docs/api')
      ->assertOk()
      ->assertSee('Multi Tenant Plog API', false);

    $response = $this->withDocsAuth()
      ->getJson('/docs/api.json')
      ->assertOk();

    $this->assertSame('3.1.2', $response->json('openapi'));
    $this->assertSame(56, count($response->json('paths')));

    $operations = collect($response->json('paths'))
      ->flatMap(fn (array $methods): array => collect($methods)
        ->only(['get', 'post', 'put', 'patch', 'delete'])
        ->values()
        ->all());

    $this->assertSame(72, $operations->count());
    $this->assertTrue(
      $operations->every(fn (array $operation): bool => filled($operation['summary'] ?? null)),
      'Every documented operation must have a summary.',
    );
    $this->assertArrayHasKey('tenantSession', $response->json('components.securitySchemes'));
    $this->assertArrayHasKey('ownerSession', $response->json('components.securitySchemes'));
    $this->assertArrayHasKey('csrfToken', $response->json('components.securitySchemes'));
    $this->assertArrayHasKey('stripeSignature', $response->json('components.securitySchemes'));
  }

  public function test_webhook_docs_include_signature_and_event_body(): void
  {
    $operation = $this->withDocsAuth()
      ->getJson('/docs/api.json')
      ->assertOk()
      ->json('paths./v1/stripe/webhook.post');

    $this->assertSame([['stripeSignature' => []]], $operation['security']);
    $this->assertSame(['id', 'type', 'data'], $operation['requestBody']['content']['application/json']['schema']['required']);
  }

  public function test_owner_auth_endpoints_are_included_in_the_auth_group(): void
  {
    $operation = $this->withDocsAuth()
      ->getJson('/docs/api.json')
      ->assertOk()
      ->json('paths./v1/owner/auth/login.post');

    $this->assertSame(['Auth'], $operation['tags']);
    $this->assertSame('Owner login', $operation['summary']);
  }

  private function withDocsAuth(): static
  {
    return $this->withHeaders([
      'Authorization' => 'Basic '.base64_encode('docs:secret'),
    ]);
  }
}
