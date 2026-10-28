<?php

return [
  'catalog' => [
    'posts.view.any',
    'posts.view.own',
    'posts.view.published',
    'posts.create',
    'posts.update.any',
    'posts.update.own',
    'posts.delete.any',
    'posts.delete.own',
    'posts.publish',
    'tenants.view',
    'users.view',
    'users.create',
    'users.update',
    'users.delete',
    'profiles.view',
    'profiles.create',
    'profiles.update',
    'profiles.delete',
    'tenant.settings.view',
    'tenant.settings.update',
    'billing.view',
    'billing.manage',
  ],

  'presets' => [
    'admin' => ['*'],
    'author' => [
      'posts.view.own',
      'posts.create',
      'posts.update.own',
      'posts.delete.own',
    ],
    'user' => [
      'posts.view.published',
      'tenants.view',
    ],
  ],
];
