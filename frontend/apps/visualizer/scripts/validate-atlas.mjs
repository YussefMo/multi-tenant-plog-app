import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '../../../..');
const filesPath = resolve(scriptDir, '../src/data/files.json');
const requestsPath = resolve(scriptDir, '../src/data/generated/requests.generated.json');

const files = JSON.parse(readFileSync(filesPath, 'utf8'));
const requestsDocument = JSON.parse(readFileSync(requestsPath, 'utf8'));

const duplicateFiles = files
  .map((file) => file.path)
  .filter((path, index, all) => all.indexOf(path) !== index);

const missingFiles = files
  .map((file) => file.path)
  .filter((path) => !existsSync(join(projectRoot, path)));

const catalogue = new Set(files.map((file) => file.path));
const missingControllers = requestsDocument.requests
  .map((request) => request.controllerFile)
  .filter((path, index, all) => all.indexOf(path) === index)
  .filter((path) => !catalogue.has(path));

if (duplicateFiles.length || missingFiles.length || missingControllers.length) {
  console.error('Atlas validation failed.');

  if (duplicateFiles.length) {
    console.error(`Duplicate files: ${duplicateFiles.join(', ')}`);
  }

  if (missingFiles.length) {
    console.error(`Missing files: ${missingFiles.join(', ')}`);
  }

  if (missingControllers.length) {
    console.error(`Controllers missing from file catalog: ${missingControllers.join(', ')}`);
  }

  process.exit(1);
}

console.log(
  `Atlas OK: ${requestsDocument.count} requests, ${files.length} files, all controller files catalogued.`,
);
