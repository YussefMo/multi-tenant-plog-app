#!/usr/bin/env php
<?php

declare(strict_types=1);

use Symfony\Component\Process\Process;

require dirname(__DIR__).'/vendor/autoload.php';

$root = dirname(__DIR__);

$process = new Process([
  PHP_BINARY,
  $root.'/vendor/bin/phpstan',
  'analyse',
  '--error-format=json',
  '--no-progress',
  '--memory-limit=1G',
], $root);
$process->run();

$result = json_decode(trim($process->getOutput()), true);

if (! is_array($result)) {
  fwrite(STDERR, $process->getErrorOutput() ?: $process->getOutput());

  exit(1);
}

foreach ($result['errors'] ?? [] as $error) {
  fwrite(STDERR, $error.PHP_EOL);
}

$files = array_keys($result['files'] ?? []);
sort($files);

if ($files === []) {
  if (($result['errors'] ?? []) === []) {
    echo 'No type errors found.'.PHP_EOL;
  }

  exit(($result['errors'] ?? []) === [] ? 0 : 1);
}

foreach ($files as $file) {
  echo str_replace($root.'/', '', $file).PHP_EOL;
}

exit(1);
