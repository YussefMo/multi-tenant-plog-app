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
    $this->assertGreaterThanOrEqual(40, count($response->json('paths')));
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
