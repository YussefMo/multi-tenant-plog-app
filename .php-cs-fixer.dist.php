<?php

declare(strict_types=1);

use PhpCsFixer\Config;
use PhpCsFixer\Finder;

$finder = Finder::create()
  ->in([
    __DIR__.'/app',
    __DIR__.'/config',
    __DIR__.'/database',
    __DIR__.'/public',
    __DIR__.'/routes',
    __DIR__.'/tests',
  ])
  ->append([
    __DIR__.'/.php-cs-fixer.dist.php',
    __DIR__.'/artisan',
    __DIR__.'/bootstrap/app.php',
    __DIR__.'/bootstrap/providers.php',
  ])
  ->exclude([
    'node_modules',
    'storage',
    'vendor',
  ])
  ->name('*.php')
  ->notName('*.blade.php')
  ->ignoreDotFiles(true)
  ->ignoreVCS(true);

return (new Config())
  ->setIndent('  ')
  ->setLineEnding("\n")
  ->setRiskyAllowed(false)
  ->setRules([
    '@PSR12' => true,
    'array_indentation' => true,
    'array_syntax' => ['syntax' => 'short'],
    'blank_line_after_opening_tag' => true,
    'concat_space' => ['spacing' => 'none'],
    'method_argument_space' => ['on_multiline' => 'ensure_fully_multiline'],
    'method_chaining_indentation' => true,
    'no_extra_blank_lines' => true,
    'no_unused_imports' => true,
    'ordered_imports' => ['sort_algorithm' => 'alpha'],
    'single_quote' => true,
    'trailing_comma_in_multiline' => [
      'elements' => ['arrays', 'arguments', 'parameters'],
    ],
  ])
  ->setFinder($finder)
  ->setCacheFile(__DIR__.'/.php-cs-fixer.cache');
