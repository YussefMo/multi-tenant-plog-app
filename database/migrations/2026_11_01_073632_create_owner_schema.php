<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class () extends Migration {
  public function up(): void
  {
    $connection = DB::connection('owner');

    if ($connection->getDriverName() !== 'pgsql') {
      return;
    }

    $schema = trim((string) $connection->getConfig('search_path'));

    if ($schema === '' || $schema === 'public') {
      return;
    }

    $quotedSchema = '"'.str_replace('"', '""', $schema).'"';

    $connection->statement("CREATE SCHEMA IF NOT EXISTS {$quotedSchema}");
  }

  public function down(): void
  {
    // Owner tables outlive this migration; the schema is dropped manually when retiring it.
  }
};
