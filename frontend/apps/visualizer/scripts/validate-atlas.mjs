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

if (problems.length > 0) {
  console.error('Atlas validation failed.');

  for (const problem of problems) {
    console.error(` - ${problem}`);
  }

  process.exit(1);
}

console.log(
  `Atlas OK: ${requestsDocument.count} requests, ${files.length} files, ${journeys.length} journeys, ${models.length} models, ${commands.length} commands, all references valid.`,
);
