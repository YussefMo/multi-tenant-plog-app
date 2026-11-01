<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration {
  public function up(): void
  {
    Schema::table('users', function (Blueprint $table) {
      $table->boolean('is_tenant_owner')->default(false)->after('is_support');
    });

    $ownerIds = DB::table('users')
      ->selectRaw('MIN(id) as owner_id')
      ->whereNotNull('tenant_id')
      ->where('role', 'admin')
      ->where('is_support', false)
      ->groupBy('tenant_id')
      ->pluck('owner_id');

    if ($ownerIds->isNotEmpty()) {
      DB::table('users')->whereIn('id', $ownerIds)->update(['is_tenant_owner' => true]);
    }
  }

  public function down(): void
  {
    Schema::table('users', function (Blueprint $table) {
      $table->dropColumn('is_tenant_owner');
    });
  }
};
