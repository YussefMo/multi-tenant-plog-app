<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
  public function up(): void
  {
    Schema::create('tenant_invitations', function (Blueprint $table) {
      $table->id();
      $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
      $table->string('email');
      $table->string('role');
      $table->json('permissions');
      $table->string('token_hash')->unique();
      $table->timestamp('expires_at');
      $table->timestamp('accepted_at')->nullable();
      $table->timestamps();
      $table->unique(['tenant_id', 'email']);
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('tenant_invitations');
  }
};
