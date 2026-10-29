<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
  public function up(): void
  {
    Schema::create('plans', function (Blueprint $table) {
      $table->id();
      $table->string('name');
      $table->string('slug')->unique();
      $table->string('stripe_product_id')->nullable()->unique();
      $table->string('stripe_price_id')->nullable()->unique();
      $table->unsignedInteger('amount')->default(0);
      $table->string('currency', 3)->default('usd');
      $table->string('interval')->default('month');
      $table->json('features');
      $table->json('limits');
      $table->boolean('is_active')->default(true);
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('plans');
  }
};
