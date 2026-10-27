<?php

namespace App\Models;

use Database\Factories\OwnerFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'is_active'])]
#[Hidden(['password', 'remember_token'])]
class Owner extends Authenticatable
{
  /** @use HasFactory<OwnerFactory> */
  use HasFactory;
  use Notifiable;

  protected $connection = 'owner';

  protected function casts(): array
  {
    return [
      'is_active' => 'boolean',
      'password' => 'hashed',
    ];
  }
}
