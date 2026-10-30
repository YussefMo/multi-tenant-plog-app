import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import type { ModelRecord } from '@/types';

export interface ModelNodeData extends Record<string, unknown> {
  model: ModelRecord;
  selected: boolean;
}

export type ModelFlowNode = Node<ModelNodeData, 'model'>;

function ModelNode({ data }: NodeProps<ModelFlowNode>) {
  const { model, selected } = data;

  return (
    <div className={`model-node connection-${model.connection}${selected ? ' selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="blueprint-handle" />
      <div className="model-node-head">
        <span>{model.connection}</span>
        <span className="node-lamp" />
      </div>
      <strong>{model.name}</strong>
      <code>{model.table}</code>
      <span className="model-node-meta">
        {model.columns.length} columns · {model.relations.length} relations
        {model.softDeletes ? ' · soft deletes' : ''}
      </span>
      <Handle type="source" position={Position.Right} className="blueprint-handle" />
    </div>
  );
}

export default memo(ModelNode);
