export type AtlasLayer =
  | 'client'
  | 'routing'
  | 'middleware'
  | 'controller'
  | 'request'
  | 'service'
  | 'model'
  | 'database'
  | 'resource'
  | 'command'
  | 'config'
  | 'test';

export type Realm = 'owner' | 'tenant' | 'public';

export interface FileRecord {
  path: string;
  layer: AtlasLayer;
  purpose: string;
  features: string[];
}

export interface RequestRecord {
  method: string;
  uri: string;
  path: string;
  name: string;
  action: string;
  controller: string;
  controllerFile: string;
  group: string;
  realm: Realm;
  permissions: string[];
  middleware: string[];
}

export interface RequestsDocument {
  generatedAt: string;
  source: string;
  count: number;
  requests: RequestRecord[];
}

export interface ArchitectureNodeData extends Record<string, unknown> {
  label: string;
  subtitle: string;
  layer: AtlasLayer;
  purpose: string;
  files: string[];
  tone: 'cyan' | 'amber' | 'green' | 'red';
}
