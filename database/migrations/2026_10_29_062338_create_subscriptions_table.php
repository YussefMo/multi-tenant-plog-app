<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
  public function up(): void
  {
    Schema::create('subscriptions', function (Blueprint $table) {
      $table->id();
      $table->foreignId('tenant_id')->unique()->constrained()->cascadeOnDelete();
      $table->foreignId('plan_id')->nullable()->constrained()->nullOnDelete();
      $table->string('stripe_customer_id')->nullable()->unique();
      $table->string('stripe_subscription_id')->nullable()->unique();
      $table->string('status')->default('incomplete')->index();
      $table->timestamp('current_period_start')->nullable();
      $table->timestamp('current_period_end')->nullable();
      $table->timestamp('trial_ends_at')->nullable();
      $table->boolean('cancel_at_period_end')->default(false);
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('subscriptions');
  }
};
