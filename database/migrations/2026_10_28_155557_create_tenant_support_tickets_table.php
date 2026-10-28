<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
  public function up(): void
  {
    Schema::create('tenant_support_tickets', function (Blueprint $table) {
      $table->id();
      $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
      $table->unsignedBigInteger('owner_id')->index();
      $table->string('token_hash')->unique();
      $table->timestamp('expires_at');
      $table->timestamp('used_at')->nullable();
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('tenant_support_tickets');
  }
};
