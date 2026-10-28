<?php

namespace App\Enums;

enum UserRole: string
{
  case Admin = 'admin';
  case Author = 'author';
  case User = 'user';

  public function permissions(): array
  {
    return (array) config("permissions.presets.{$this->value}", []);
  }
}
