<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
  public function up(): void
  {
    Schema::create('users', function (Blueprint $table) {
      $table->id();
      $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
      $table->string('name');
      $table->string('email')->unique();
      $table->string('password')->nullable();
      $table->string('role');
      $table->foreignId('permission_profile_id')->nullable()->constrained('permission_profiles')->nullOnDelete();
      $table->json('permissions');
      $table->json('extra_permissions');
      $table->boolean('is_support')->default(false);
      $table->timestamp('email_verified_at')->nullable();
      $table->rememberToken();
      $table->timestamps();
      $table->index(['tenant_id', 'role']);
    });

    Schema::create('password_reset_tokens', function (Blueprint $table) {
      $table->string('email')->primary();
      $table->string('token');
      $table->timestamp('created_at')->nullable();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('password_reset_tokens');
    Schema::dropIfExists('users');
  }
};
