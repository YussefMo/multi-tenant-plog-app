<?php

namespace App\Console\Commands;

use App\Models\Owner;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

#[Signature('owner:create
  {--name= : Owner name}
  {--email= : Owner email}
  {--password= : Owner password}')]
#[Description('Create a software owner')]
class OwnerCreateCommand extends Command
{
  public function handle(): int
  {
    $name = $this->option('name') ?: $this->ask('Name');
    $email = $this->option('email') ?: $this->ask('Email');
    $password = $this->option('password') ?: $this->secret('Password');

    $validator = Validator::make(
      compact('name', 'email', 'password'),
      [
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255'],
        'password' => ['required', 'string', 'min:8'],
      ],
    );

    if ($validator->fails()) {
      foreach ($validator->errors()->all() as $error) {
        $this->error($error);
      }

      return self::FAILURE;
    }

    if (Owner::where('email', $email)->exists()) {
      $this->error('An owner with this email already exists.');

      return self::FAILURE;
    }

    $owner = Owner::create([
      'name' => $name,
      'email' => $email,
      'password' => $password,
      'is_active' => true,
    ]);

    $this->info("Owner created: {$owner->email}");

    return self::SUCCESS;
  }
}
