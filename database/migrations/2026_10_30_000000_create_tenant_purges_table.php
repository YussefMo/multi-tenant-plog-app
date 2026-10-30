<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
  public function up(): void
  {
    Schema::create('tenant_purges', function (Blueprint $table) {
      $table->id();
      $table->unsignedBigInteger('tenant_id')->index();
      $table->unsignedBigInteger('owner_id')->index();
      $table->string('tenant_name');
      $table->string('admin_email')->nullable();
      $table->unsignedBigInteger('purged_by_owner_id')->nullable()->index();
      $table->timestamp('purged_at')->nullable();
      $table->json('snapshot')->nullable();
      $table->timestamps();
    });
  }

  public function down(): void
  {
    Schema::dropIfExists('tenant_purges');
  }
};
