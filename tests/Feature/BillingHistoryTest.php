<?php

namespace Tests\Feature;

use App\Models\BillingInvoice;
use App\Models\BillingPayment;
use App\Models\Owner;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillingHistoryTest extends TestCase
{
  use RefreshDatabase;

  private Tenant $tenant;

  private User $admin;

  protected function setUp(): void
  {
    parent::setUp();

    $this->refreshOwnerDatabase();

    $this->tenant = Tenant::factory()->create();
    $this->admin = User::factory()->forTenant($this->tenant)->admin()->create();
  }

  public function test_tenant_invoices_are_scoped_and_filterable(): void
  {
    $this->invoice(['status' => 'paid', 'stripe_invoice_id' => 'in_paid']);
    $this->invoice(['status' => 'open', 'stripe_invoice_id' => 'in_open']);

    $otherTenant = Tenant::factory()->create();
    BillingInvoice::factory()->forTenant($otherTenant)->create(['stripe_invoice_id' => 'in_other']);

    $this->actingAs($this->admin)
      ->getJson('/api/v1/billing/invoices')
      ->assertOk()
      ->assertJsonCount(2, 'data');

    $this->actingAs($this->admin)
      ->getJson('/api/v1/billing/invoices?status=paid')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.stripe_invoice_id', 'in_paid');
  }

  public function test_tenant_payments_are_scoped_and_filterable_by_date(): void
  {
    $this->payment([
      'stripe_charge_id' => 'ch_recent',
      'paid_at' => now(),
    ]);
    $this->payment([
      'stripe_charge_id' => 'ch_old',
      'paid_at' => now()->subDays(10),
    ]);

    $otherTenant = Tenant::factory()->create();
    BillingPayment::factory()->forTenant($otherTenant)->create(['stripe_charge_id' => 'ch_other']);

    $response = $this->actingAs($this->admin)
      ->getJson('/api/v1/billing/payments?from='.now()->subDays(2)->toDateString())
      ->assertOk()
      ->assertJsonCount(1, 'data');

    $this->assertSame('ch_recent', $response->json('data.0.stripe_charge_id'));
  }

  public function test_owner_can_view_all_transactions_with_filters(): void
  {
    $owner = Owner::factory()->create();
    $otherTenant = Tenant::factory()->create();

    BillingPayment::factory()->forTenant($this->tenant)->create([
      'stripe_charge_id' => 'ch_one',
      'status' => 'succeeded',
    ]);
    BillingPayment::factory()->forTenant($otherTenant)->create([
      'stripe_charge_id' => 'ch_two',
      'status' => 'failed',
    ]);

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/billing/transactions?tenant_id='.$this->tenant->id)
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.stripe_charge_id', 'ch_one')
      ->assertJsonPath('data.0.tenant.id', $this->tenant->id);

    $this->actingAs($owner, 'owner')
      ->getJson('/api/v1/owner/billing/transactions?status=failed')
      ->assertOk()
      ->assertJsonCount(1, 'data')
      ->assertJsonPath('data.0.stripe_charge_id', 'ch_two');
  }

  public function test_author_cannot_view_billing_history(): void
  {
    $author = User::factory()->forTenant($this->tenant)->author()->create();

    $this->actingAs($author)
      ->getJson('/api/v1/billing/invoices')
      ->assertForbidden();

    $this->actingAs($author)
      ->getJson('/api/v1/billing/payments')
      ->assertForbidden();
  }

  /**
   * @param  array<string, mixed>  $attributes
   */
  private function invoice(array $attributes = []): BillingInvoice
  {
    return BillingInvoice::factory()->forTenant($this->tenant)->create($attributes);
  }

  /**
   * @param  array<string, mixed>  $attributes
   */
  private function payment(array $attributes = []): BillingPayment
  {
    return BillingPayment::factory()->forTenant($this->tenant)->create($attributes);
  }
}
