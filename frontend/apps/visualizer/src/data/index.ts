import filesJson from '@/data/files.json';
import requestsJson from '@/data/generated/requests.generated.json';
import { commands, commandsByName, schedules } from '@/data/commands';
import { journeys, journeysById } from '@/data/journeys';
import { erdEdges, models, modelsByName, tables, tablesByName } from '@/data/models';
import type { FileRecord, RequestsDocument } from '@/types';

export const files = filesJson as FileRecord[];
export const requestsDocument = requestsJson as RequestsDocument;
export const filesByPath = new Map(files.map((file) => [file.path, file]));
export const requestsByPath = new Map(
  requestsDocument.requests.map((request) => [`${request.method} ${request.path}`, request]),
);

export {
  commands,
  commandsByName,
  erdEdges,
  journeys,
  journeysById,
  models,
  modelsByName,
  schedules,
  tables,
  tablesByName,
};
