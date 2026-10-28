<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
  public function up(): void
  {
    Schema::create('tenant_support_accesses', function (Blueprint $table) {
      $table->id();
      $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
      $table->unsignedBigInteger('owner_id')->index();
      $table->foreignId('impersonated_user_id')->constrained('users')->cascadeOnDelete();
      $table->timestamp('started_at');
      $table->timestamp('ended_at')->nullable();
      $table->string('ip_address', 45)->nullable();
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('tenant_support_accesses');
  }
};
