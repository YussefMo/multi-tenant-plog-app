import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type NodeMouseHandler,
} from '@xyflow/react';
import { useCallback, useMemo } from 'react';
import { erdEdges, models } from '@/data';
import ModelNode, { type ModelFlowNode } from '@/components/ModelNode';

const nodeTypes = {
  model: ModelNode,
};

const positions: Record<string, { x: number; y: number }> = {
  Owner: { x: 0, y: 40 },
  Tenant: { x: 300, y: 40 },
  User: { x: 600, y: 40 },
  PermissionProfile: { x: 300, y: 220 },
  Post: { x: 600, y: 220 },
  TenantInvitation: { x: 300, y: 400 },
  TenantSupportTicket: { x: 0, y: 220 },
  TenantSupportAccess: { x: 0, y: 400 },
  Plan: { x: 900, y: 40 },
  Subscription: { x: 900, y: 220 },
  BillingInvoice: { x: 900, y: 400 },
  BillingPayment: { x: 900, y: 580 },
  StripeWebhookEvent: { x: 600, y: 400 },
};

interface ModelGraphProps {
  selectedName: string;
  onSelect: (name: string) => void;
}

export default function ModelGraph({ selectedName, onSelect }: ModelGraphProps) {
  const nodes = useMemo<ModelFlowNode[]>(
    () =>
      models.map((model) => ({
        id: model.name,
        type: 'model',
        position: positions[model.name] ?? { x: 0, y: 0 },
        data: { model, selected: model.name === selectedName },
      })),
    [selectedName],
  );

  const edges = useMemo<Edge[]>(
    () =>
      erdEdges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: edge.label,
        animated: false,
        labelStyle: { fill: '#7590a3', fontSize: 9, fontFamily: 'ui-monospace, monospace' },
        labelBgStyle: { fill: '#07111b', fillOpacity: 0.85 },
        style: { stroke: 'rgba(79, 209, 197, 0.32)', strokeWidth: 1.1 },
      })),
    [],
  );

  const handleNodeClick = useCallback<NodeMouseHandler<ModelFlowNode>>(
    (_event, node) => {
      onSelect(node.id);
    },
    [onSelect],
  );

  return (
    <div className="model-graph">
      <ReactFlow<ModelFlowNode>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.16, maxZoom: 0.85 }}
        minZoom={0.3}
        maxZoom={1.3}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="rgba(79, 209, 197, 0.14)"
        />
        <MiniMap
          pannable
          zoomable
          className="atlas-minimap"
          nodeColor={(node) => {
            const data = node.data as { model?: { connection?: string } };
            return data.model?.connection === 'owner' ? '#f87171' : '#4fd1c5';
          }}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
