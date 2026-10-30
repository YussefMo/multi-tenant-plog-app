import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type NodeMouseHandler,
} from '@xyflow/react';
import { useCallback } from 'react';
import type { ArchitectureNodeData } from '@/types';
import { architectureEdges, architectureNodes } from '@/data/architecture';
import BlueprintNode, { type BlueprintNodeType } from '@/components/BlueprintNode';

const nodeTypes = {
  blueprint: BlueprintNode,
};

const defaultEdgeOptions = {
  animated: true,
  style: {
    stroke: 'rgba(79, 209, 197, 0.42)',
    strokeWidth: 1.2,
  },
};

interface ArchitectureMapProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function ArchitectureMap({ selectedId, onSelect }: ArchitectureMapProps) {
  const handleNodeClick = useCallback<NodeMouseHandler<BlueprintNodeType>>(
    (_event, node) => {
      onSelect(node.id);
    },
    [onSelect],
  );

  return (
    <div className="architecture-map">
      <ReactFlow<BlueprintNodeType>
        nodes={architectureNodes.map((node) => ({
          ...node,
          selected: node.id === selectedId,
        }))}
        edges={architectureEdges}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        fitViewOptions={{ padding: 0.18, maxZoom: 0.9 }}
        onInit={(instance) => {
          instance.fitView({ padding: 0.18, duration: 0 });
        }}
        minZoom={0.35}
        maxZoom={1.4}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="rgba(79, 209, 197, 0.16)"
        />
        <MiniMap
          pannable
          zoomable
          className="atlas-minimap"
          nodeColor={(node) => {
            const data = node.data as ArchitectureNodeData;
            return data.tone === 'amber'
              ? '#fbbf24'
              : data.tone === 'green'
                ? '#34d399'
                : data.tone === 'red'
                  ? '#f87171'
                  : '#4fd1c5';
          }}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
