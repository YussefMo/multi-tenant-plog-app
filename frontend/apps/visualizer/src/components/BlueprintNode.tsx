import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import type { ArchitectureNodeData } from '@/types';

export type BlueprintNodeType = Node<ArchitectureNodeData, 'blueprint'>;

function BlueprintNode({ data, selected }: NodeProps<BlueprintNodeType>) {
  return (
    <div className={`blueprint-node tone-${data.tone}${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="blueprint-handle" />
      <div className="blueprint-node-head">
        <span className="layer-tag">{data.layer}</span>
        <span className="node-lamp" />
      </div>
      <strong>{data.label}</strong>
      <span className="node-subtitle">{data.subtitle}</span>
      <Handle type="source" position={Position.Right} className="blueprint-handle" />
    </div>
  );
}

export default memo(BlueprintNode);
