import filesJson from './files.json';
import requestsJson from './generated/requests.generated.json';
import type { FileRecord, RequestsDocument } from '../types';

export const files = filesJson as FileRecord[];
export const requestsDocument = requestsJson as RequestsDocument;
export const filesByPath = new Map(files.map((file) => [file.path, file]));
