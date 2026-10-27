<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Artisan;

abstract class TestCase extends BaseTestCase
{
  protected function refreshOwnerDatabase(): void
  {
    Artisan::call('migrate:fresh', [
      '--database' => 'owner',
      '--path' => 'database/migrations/owner',
      '--force' => true,
    ]);
  }
}
