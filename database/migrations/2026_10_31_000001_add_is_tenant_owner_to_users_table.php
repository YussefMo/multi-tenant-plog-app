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

    DB::statement(
      <<<'SQL'
        UPDATE users
        INNER JOIN (
          SELECT tenant_id, MIN(id) AS id
          FROM users
          WHERE tenant_id IS NOT NULL AND role = 'admin' AND is_support = 0
          GROUP BY tenant_id
        ) AS first_admin ON first_admin.id = users.id
        SET users.is_tenant_owner = 1
      SQL,
    );
  }

  public function down(): void
  {
    Schema::table('users', function (Blueprint $table) {
      $table->dropColumn('is_tenant_owner');
    });
  }
};
