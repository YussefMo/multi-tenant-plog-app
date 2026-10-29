import type { AtlasLayer, Realm } from '../types';

export function MethodBadge({ method }: { method: string }) {
  return <span className={`method method-${method.toLowerCase()}`}>{method}</span>;
}

export function RealmBadge({ realm }: { realm: Realm }) {
  return <span className={`realm realm-${realm}`}>{realm}</span>;
}

export function LayerBadge({ layer }: { layer: AtlasLayer }) {
  return <span className={`layer-badge layer-${layer}`}>{layer}</span>;
}
