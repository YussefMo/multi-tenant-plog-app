import type { ReactNode } from 'react';
import type { AtlasLayer, DbOperation, Realm } from '@/types';

export function MethodBadge({ method }: { method: string }) {
  return <span className={`method method-${method.toLowerCase()}`}>{method}</span>;
}

export function RealmBadge({ realm }: { realm: Realm }) {
  return <span className={`realm realm-${realm}`}>{realm}</span>;
}

export function LayerBadge({ layer }: { layer: AtlasLayer }) {
  return <span className={`layer-badge layer-${layer}`}>{layer}</span>;
}

export function DbOpBadge({ operation }: { operation: DbOperation }) {
  return <span className={`db-op db-op-${operation}`}>{operation}</span>;
}

export function ToneBadge({ tone, children }: { tone: string; children: ReactNode }) {
  return <span className={`tone-badge tone-${tone}`}>{children}</span>;
}
