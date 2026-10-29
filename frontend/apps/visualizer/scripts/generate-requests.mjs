import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '../../../..');
const outputDir = resolve(scriptDir, '../src/data/generated');
const outputFile = join(outputDir, 'requests.generated.json');

const publicPaths = new Set([
  '/api/v1/csrf-token',
  '/api/v1/owner/csrf-token',
  '/api/v1/health',
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/accept-invitation',
  '/api/v1/auth/support-login',
  '/api/v1/owner/auth/login',
  '/api/v1/billing/checkout/success',
  '/api/v1/billing/checkout/cancel',
  '/api/v1/billing/portal/return',
  '/api/v1/stripe/webhook',
]);

function words(value) {
  return value
    .replace(/Controller$/, '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\bApi\b/g, '')
    .trim();
}

function groupFor(controllerClass, namespace) {
  if (controllerClass === 'Closure') {
    return 'Health';
  }

  const controller = controllerClass.split('\\').at(-1) ?? 'Controller';
  const label = words(controller);

  if (namespace.includes('\\Owner\\')) {
    return `Owner · ${label}`;
  }

  return label;
}

function controllerFile(action) {
  if (action === 'Closure' || !action.includes('@')) {
    return 'routes/api.php';
  }

  const controllerClass = action.split('@').at(0) ?? '';
  const relative = controllerClass.replace('App\\Http\\Controllers\\', '').replaceAll('\\', '/');

  return `app/Http/Controllers/${relative}.php`;
}

function realmFor(path) {
  if (publicPaths.has(path)) {
    return 'public';
  }

  if (path.startsWith('/api/v1/owner/')) {
    return 'owner';
  }

  return 'tenant';
}

function permissionsFor(middleware) {
  return middleware
    .filter((item) => item.startsWith('permission:'))
    .flatMap((item) => item.slice('permission:'.length).split(','))
    .map((item) => item.trim())
    .filter(Boolean);
}

const raw = execFileSync('php', ['artisan', 'route:list', '--json', '--except-vendor'], {
  cwd: projectRoot,
  encoding: 'utf8',
});

const routeList = JSON.parse(raw);
const requests = routeList
  .filter((route) => route.uri.startsWith('api/'))
  .map((route) => {
    const path = `/${route.uri}`;
    const action = String(route.action);
    const controllerClass = action.split('@').at(0) ?? action;
    const namespace = controllerClass.split('\\').slice(0, -1).join('\\');
    const method = String(route.method).split('|')[0];

    return {
      method,
      uri: route.uri,
      path,
      name: route.name,
      action,
      controller: controllerClass.split('\\').at(-1) ?? controllerClass,
      controllerFile: controllerFile(action),
      group: groupFor(controllerClass, namespace),
      realm: realmFor(path),
      permissions: permissionsFor(route.middleware ?? []),
      middleware: route.middleware ?? [],
    };
  })
  .sort(
    (left, right) => left.path.localeCompare(right.path) || left.method.localeCompare(right.method),
  );

const document = {
  generatedAt: new Date().toISOString(),
  source: 'php artisan route:list --json --except-vendor',
  count: requests.length,
  requests,
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputFile, `${JSON.stringify(document, null, 2)}\n`);

console.log(`Generated ${requests.length} API operations at ${outputFile}`);
