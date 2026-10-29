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

export type Tone = 'cyan' | 'amber' | 'green' | 'red';

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
  tone: Tone;
}

export type DbOperation = 'read' | 'insert' | 'update' | 'delete' | 'upsert';

export interface TableImpact {
  table: string;
  operation: DbOperation;
  detail: string;
}

export interface StepRequest {
  method: string;
  path: string;
}

export interface JourneyStep {
  id: string;
  title: string;
  summary: string;
  actor: string;
  request?: StepRequest;
  requestClass?: string;
  middleware?: string[];
  controller?: string;
  service?: string;
  models?: string[];
  tables?: TableImpact[];
  response?: string;
  errors?: string[];
  files?: string[];
  speakerNotes: string;
}

export interface Journey {
  id: string;
  kind: 'journey' | 'system';
  title: string;
  subtitle: string;
  feature: string;
  realm: Realm;
  tone: Tone;
  actors: string[];
  preconditions: string[];
  outcome: string;
  files: string[];
  steps: JourneyStep[];
}

export type RelationType = 'belongsTo' | 'hasMany' | 'hasOne';

export interface ModelRelation {
  type: RelationType;
  model: string;
  foreignKey: string;
}

export interface ModelColumn {
  name: string;
  type: string;
  note?: string;
}

export interface ModelRecord {
  name: string;
  table: string;
  connection: 'app' | 'owner';
  file: string;
  purpose: string;
  softDeletes: boolean;
  scopes: string[];
  columns: ModelColumn[];
  relations: ModelRelation[];
  readers: string[];
  writers: string[];
}

export interface TableRecord {
  name: string;
  connection: 'app' | 'owner';
  purpose: string;
  columns: ModelColumn[];
  indexes: string[];
  softDeletes: boolean;
  model?: string;
  readers: string[];
  writers: string[];
}

export interface CommandOption {
  flag: string;
  description: string;
}

export interface CommandRecord {
  name: string;
  signature: string;
  file: string;
  purpose: string;
  tone: Tone;
  options: CommandOption[];
  reads: string[];
  writes: TableImpact[];
  external: string[];
  schedule?: string;
  idempotent: boolean;
  output: string[];
  notes: string;
}
