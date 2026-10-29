<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApiDocsTest extends TestCase
{
  public function test_openapi_docs_are_available_in_local(): void
  {
    $this->app['env'] = 'local';
    config(['app.env' => 'local']);

    $this->get('/docs/api')
      ->assertOk()
      ->assertSee('Multi Tenant Plog API', false);

    $response = $this->getJson('/docs/api.json')->assertOk();

    $this->assertSame('3.1.2', $response->json('openapi'));
    $this->assertGreaterThanOrEqual(40, count($response->json('paths')));
    $this->assertArrayHasKey('tenantSession', $response->json('components.securitySchemes'));
    $this->assertArrayHasKey('ownerSession', $response->json('components.securitySchemes'));
    $this->assertArrayHasKey('csrfToken', $response->json('components.securitySchemes'));
    $this->assertArrayHasKey('stripeSignature', $response->json('components.securitySchemes'));
  }

  public function test_webhook_docs_include_signature_and_event_body(): void
  {
    $this->app['env'] = 'local';
    config(['app.env' => 'local']);

    $operation = $this->getJson('/docs/api.json')
      ->assertOk()
      ->json('paths./v1/stripe/webhook.post');

    $this->assertSame([['stripeSignature' => []]], $operation['security']);
    $this->assertSame(['id', 'type', 'data'], $operation['requestBody']['content']['application/json']['schema']['required']);
  }
}
