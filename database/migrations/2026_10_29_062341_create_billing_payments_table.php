<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
  public function up(): void
  {
    Schema::create('billing_payments', function (Blueprint $table) {
      $table->id();
      $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
      $table->string('stripe_charge_id')->nullable()->unique();
      $table->string('stripe_payment_intent_id')->nullable()->unique();
      $table->string('stripe_invoice_id')->nullable()->index();
      $table->unsignedInteger('amount')->default(0);
      $table->unsignedInteger('amount_refunded')->default(0);
      $table->string('currency', 3)->default('usd');
      $table->string('status')->index();
      $table->timestamp('paid_at')->nullable();
      $table->timestamps();
      $table->index(['tenant_id', 'paid_at']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('billing_payments');
  }
};
