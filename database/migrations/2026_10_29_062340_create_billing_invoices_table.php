<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
  public function up(): void
  {
    Schema::create('billing_invoices', function (Blueprint $table) {
      $table->id();
      $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
      $table->string('stripe_invoice_id')->unique();
      $table->string('stripe_customer_id')->nullable()->index();
      $table->string('stripe_subscription_id')->nullable()->index();
      $table->string('status')->index();
      $table->string('currency', 3)->default('usd');
      $table->unsignedInteger('subtotal')->default(0);
      $table->unsignedInteger('tax')->default(0);
      $table->unsignedInteger('total')->default(0);
      $table->unsignedInteger('amount_paid')->default(0);
      $table->unsignedInteger('amount_due')->default(0);
      $table->text('hosted_invoice_url')->nullable();
      $table->text('invoice_pdf')->nullable();
      $table->timestamp('period_start')->nullable();
      $table->timestamp('period_end')->nullable();
      $table->timestamp('paid_at')->nullable();
      $table->timestamps();
      $table->index(['tenant_id', 'paid_at']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('billing_invoices');
  }
};
