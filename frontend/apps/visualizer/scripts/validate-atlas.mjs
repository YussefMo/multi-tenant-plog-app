import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '../../../..');
const dataDir = resolve(scriptDir, '../src/data');
const filesPath = resolve(dataDir, 'files.json');
const requestsPath = resolve(dataDir, 'generated/requests.generated.json');
const journeysPath = resolve(dataDir, 'journeys.ts');
const modelsPath = resolve(dataDir, 'models.ts');
const commandsPath = resolve(dataDir, 'commands.ts');
const securityPath = resolve(dataDir, 'security.ts');

const files = JSON.parse(readFileSync(filesPath, 'utf8'));
const requestsDocument = JSON.parse(readFileSync(requestsPath, 'utf8'));

/**
 * Reads a top-level `export const name: Type[] = [ ... ]` array from a data module.
 * The data modules only contain plain object literals, so evaluating the array is safe.
 */
function loadArray(filePath, exportName) {
  const source = readFileSync(filePath, 'utf8');
  const pattern = new RegExp(`export const ${exportName}(?::[^=]+)?\\s*=\\s*\\[`);
  const match = pattern.exec(source);

  if (!match) {
    throw new Error(`Could not find ${exportName} in ${filePath}`);
  }

  const start = source.indexOf('[', source.indexOf('=', match.index));
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];

    if (quote !== null) {
      if (escaped) {
        escaped = false;
      } else if (character === '\\') {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }

      continue;
    }

    if (character === "'" || character === '"' || character === '`') {
      quote = character;
      continue;
    }

    if (character === '[') {
      depth += 1;
    } else if (character === ']') {
      depth -= 1;

      if (depth === 0) {
        const literal = source.slice(start, index + 1);

        return new Function(`return (${literal});`)();
      }
    }
  }

  throw new Error(`Unbalanced array for ${exportName} in ${filePath}`);
}

const journeys = loadArray(journeysPath, 'journeys');
const models = loadArray(modelsPath, 'models');
const systemTables = loadArray(modelsPath, 'systemTables');
const commands = loadArray(commandsPath, 'commands');
const securityCategories = loadArray(securityPath, 'securityCategories');
const securityMeasures = loadArray(securityPath, 'securityMeasures');

const problems = [];
const fail = (message) => problems.push(message);

const duplicateFiles = files
  .map((file) => file.path)
  .filter((path, index, all) => all.indexOf(path) !== index);

if (duplicateFiles.length) {
  fail(`Duplicate catalogued files: ${duplicateFiles.join(', ')}`);
}

const missingFiles = files
  .map((file) => file.path)
  .filter((path) => !existsSync(join(projectRoot, path)));

if (missingFiles.length) {
  fail(`Missing catalogued files: ${missingFiles.join(', ')}`);
}

const catalogue = new Set(files.map((file) => file.path));
const requestKeys = new Set(
  requestsDocument.requests.map((request) => `${request.method} ${request.path}`),
);

const missingControllers = requestsDocument.requests
  .map((request) => request.controllerFile)
  .filter((path, index, all) => all.indexOf(path) === index)
  .filter((path) => !catalogue.has(path));

if (missingControllers.length) {
  fail(`Controllers missing from file catalog: ${missingControllers.join(', ')}`);
}

const modelNames = new Set(models.map((model) => model.name));
const tableNames = new Set([
  ...models.map((model) => model.table),
  ...systemTables.map((table) => table.name),
]);

const checkCatalogue = (path, context) => {
  if (!catalogue.has(path)) {
    fail(`${context} references uncatalogued file: ${path}`);
  }
};

const journeyIds = new Set();

for (const journey of journeys) {
  if (journeyIds.has(journey.id)) {
    fail(`Duplicate journey id: ${journey.id}`);
  }

  journeyIds.add(journey.id);

  if (!Array.isArray(journey.steps) || journey.steps.length === 0) {
    fail(`Journey ${journey.id} has no steps`);
    continue;
  }

  const stepIds = new Set();

  for (const step of journey.steps) {
    const context = `Journey ${journey.id} step ${step.id}`;

    if (stepIds.has(step.id)) {
      fail(`${context} has a duplicate step id`);
    }

    stepIds.add(step.id);

    if (step.request) {
      const key = `${step.request.method} ${step.request.path}`;

      if (!requestKeys.has(key)) {
        fail(`${context} references unknown request: ${key}`);
      }
    }

    for (const path of step.files ?? []) {
      checkCatalogue(path, context);
    }

    for (const model of step.models ?? []) {
      if (!modelNames.has(model)) {
        fail(`${context} references unknown model: ${model}`);
      }
    }

    for (const impact of step.tables ?? []) {
      if (!tableNames.has(impact.table)) {
        fail(`${context} references unknown table: ${impact.table}`);
      }
    }
  }

  for (const path of journey.files ?? []) {
    checkCatalogue(path, `Journey ${journey.id}`);
  }
}

for (const model of models) {
  checkCatalogue(model.file, `Model ${model.name}`);

  if (!tableNames.has(model.table)) {
    fail(`Model ${model.name} has an unknown table: ${model.table}`);
  }

  for (const relation of model.relations) {
    if (!modelNames.has(relation.model)) {
      fail(`Model ${model.name} relates to unknown model: ${relation.model}`);
    }
  }
}

for (const command of commands) {
  checkCatalogue(command.file, `Command ${command.name}`);

  for (const write of command.writes) {
    if (!tableNames.has(write.table)) {
      fail(`Command ${command.name} writes to unknown table: ${write.table}`);
    }
  }
}

const securityCategoryIds = new Set(securityCategories.map((category) => category.id));
const securityFiles = new Set();
const securityMeasureIds = new Set();
const securityRealms = new Set(['owner', 'tenant', 'public', 'cross-cutting']);
const securityPostures = new Set(['enforced', 'configurable', 'defense-in-depth']);
const securityRisks = new Set(['critical', 'high', 'medium', 'low']);

if (securityCategories.length === 0) {
  fail('Security categories are empty.');
}

if (securityMeasures.length === 0) {
  fail('Security measures are empty.');
}

for (const measure of securityMeasures) {
  const context = `Security measure ${measure.id}`;

  if (securityMeasureIds.has(measure.id)) {
    fail(`Duplicate security measure id: ${measure.id}`);
  }

  securityMeasureIds.add(measure.id);

  if (!securityCategoryIds.has(measure.category)) {
    fail(`${context} references unknown category: ${measure.category}`);
  }

  if (!securityRealms.has(measure.realm)) {
    fail(`${context} has an invalid realm: ${measure.realm}`);
  }

  if (!securityPostures.has(measure.posture)) {
    fail(`${context} has an invalid posture: ${measure.posture}`);
  }

  if (!securityRisks.has(measure.risk)) {
    fail(`${context} has an invalid risk: ${measure.risk}`);
  }

  for (const key of ['title', 'summary', 'threat', 'control', 'why']) {
    if (typeof measure[key] !== 'string' || measure[key].trim() === '') {
      fail(`${context} is missing ${key}`);
    }
  }

  if (!Array.isArray(measure.implementation) || measure.implementation.length < 2) {
    fail(`${context} needs at least two implementation steps`);
  }

  if (!Array.isArray(measure.files) || measure.files.length < 2) {
    fail(`${context} needs at least two reference files`);
  }

  for (const path of measure.files ?? []) {
    checkCatalogue(path, context);
    securityFiles.add(path);
  }

  for (const path of measure.tests ?? []) {
    checkCatalogue(path, context);
    securityFiles.add(path);
  }

  for (const endpoint of measure.endpoints ?? []) {
    const key = `${endpoint.method} ${endpoint.path}`;

    if (!requestKeys.has(key)) {
      fail(`${context} references unknown request: ${key}`);
    }
  }

  for (const journey of measure.journeys ?? []) {
    if (!journeyIds.has(journey)) {
      fail(`${context} references unknown journey: ${journey}`);
    }
  }
}

const requiredSecurityCoverage = [
  'app/Http/Middleware/ResolveSessionRealm.php',
  'app/Http/Middleware/ForceJsonResponse.php',
  'app/Http/Middleware/EnsurePermission.php',
  'app/Http/Middleware/EnsureTenantActive.php',
  'app/Http/Middleware/EnsureSupportAccess.php',
  'app/Http/Middleware/EnsureTenantNotDue.php',
  'app/Http/Middleware/ProtectDocsAccess.php',
  'app/Policies/PostPolicy.php',
  'app/Models/Scopes/TenantScope.php',
  'app/Models/Concerns/BelongsToTenant.php',
  'app/Http/Controllers/Concerns/AuthorizesPermissions.php',
  'app/Services/PermissionSyncService.php',
  'app/Services/TenantInvitationService.php',
  'app/Services/TenantProvisioningService.php',
  'app/Services/TenantPurgeService.php',
  'app/Services/TenantTrialService.php',
  'app/Services/SupportUserService.php',
  'app/Services/StripeWebhookService.php',
  'app/Services/StripeGateway.php',
  'app/Services/SubscriptionSyncService.php',
  'app/Services/BillingMirrorService.php',
  'app/Services/BillingService.php',
  'app/Services/FrontendUrlService.php',
  'app/Http/Controllers/Api/SystemController.php',
  'app/Http/Controllers/Api/StripeWebhookController.php',
  'app/Http/Controllers/Api/Owner/OwnerAuthController.php',
  'app/Http/Controllers/Api/Owner/TenantController.php',
  'app/Http/Controllers/Api/Owner/PlanController.php',
  'app/Http/Controllers/Api/Owner/SupportAccessController.php',
  'app/Http/Controllers/Api/Tenant/AuthController.php',
  'app/Http/Controllers/Api/Tenant/UserController.php',
  'app/Http/Controllers/Api/Tenant/PostController.php',
  'app/Http/Controllers/Api/Tenant/PermissionProfileController.php',
  'app/Http/Controllers/Api/Tenant/BillingController.php',
  'app/Http/Controllers/Api/Tenant/TenantDirectoryController.php',
  'app/Http/Controllers/Api/Tenant/ViewerOverviewController.php',
  'app/Http/Controllers/Api/Tenant/TenantSettingsController.php',
  'app/Http/Controllers/Api/Tenant/TenantOverviewController.php',
  'app/Http/Controllers/Api/Tenant/BillingRedirectController.php',
  'config/auth.php',
  'config/session.php',
  'config/cors.php',
  'config/permissions.php',
  'config/support.php',
  'config/scramble.php',
  'config/services.php',
  'config/frontends.php',
  'config/database.php',
  'bootstrap/app.php',
  'routes/api.php',
  'routes/console.php',
  'database/migrations/2026_10_31_000001_add_is_tenant_owner_to_users_table.php',
  'database/migrations/2026_10_31_000000_add_trial_used_at_to_tenants_table.php',
  'database/migrations/2026_10_30_000000_create_tenant_purges_table.php',
  'tests/Feature/SessionRealmTest.php',
  'tests/Feature/OwnerAuthTest.php',
  'tests/Feature/TenantAuthTest.php',
  'tests/Feature/SupportAccessTest.php',
  'tests/Feature/TenantDueProtectionTest.php',
  'tests/Feature/StripeWebhookTest.php',
  'tests/Feature/UserManagementTest.php',
  'tests/Feature/TenantInvitationTest.php',
  'tests/Feature/TenantLifecycleTest.php',
  'tests/Feature/TenantPurgeTest.php',
  'tests/Feature/OwnerTenantTest.php',
  'tests/Feature/PermissionSystemTest.php',
  'tests/Feature/PermissionProfileTest.php',
  'tests/Feature/TenantDirectoryTest.php',
  'tests/Feature/ApiDocsTest.php',
  'tests/Feature/ApiErrorTest.php',
  'tests/Feature/OwnerProfileTest.php',
  'tests/Feature/TenantTrialTest.php',
  'tests/Feature/BillingCheckoutTest.php',
  'tests/Feature/BillingHistoryTest.php',
  'tests/Feature/HealthTest.php',
  'tests/Feature/ViewerOverviewTest.php',
  'tests/Feature/TenantOverviewTest.php',
];

const uncoveredSecurityFiles = requiredSecurityCoverage.filter((path) => !securityFiles.has(path));

if (uncoveredSecurityFiles.length > 0) {
  fail(`Security coverage missing: ${uncoveredSecurityFiles.join(', ')}`);
}

if (problems.length > 0) {
  console.error('Atlas validation failed.');

  for (const problem of problems) {
    console.error(` - ${problem}`);
  }

  process.exit(1);
}

console.log(
  `Atlas OK: ${requestsDocument.count} requests, ${files.length} files, ${journeys.length} journeys, ${models.length} models, ${commands.length} commands, ${securityMeasures.length} security measures, ${securityCategories.length} categories, ${requiredSecurityCoverage.length - uncoveredSecurityFiles.length}/${requiredSecurityCoverage.length} critical files covered, all references valid.`,
);
