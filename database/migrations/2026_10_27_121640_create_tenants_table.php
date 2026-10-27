<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
  public function up(): void
  {
    Schema::create('tenants', function (Blueprint $table) {
      $table->id();
      $table->unsignedBigInteger('owner_id')->index();
      $table->string('name');
      $table->string('slug')->unique();
      $table->string('category')->nullable();
      $table->boolean('allow_support')->default(false);
      $table->string('stripe_customer_id')->nullable()->unique();
      $table->softDeletes();
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('tenants');
  }
};
