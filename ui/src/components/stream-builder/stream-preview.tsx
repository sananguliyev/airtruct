import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import StreamNode from "./stream-node";
import type { StreamNodeData } from "./stream-node";
import { v4 as uuidv4 } from "uuid";
import { Stream, ComponentConfig } from "@/lib/entities";

interface StreamPreviewProps {
  stream: Stream;
  componentConfigs: ComponentConfig[];
}

export default function StreamPreview({ stream, componentConfigs }: StreamPreviewProps) {
  // Helper to get component label from ID
  const getComponentLabel = (componentId: string, configs: ComponentConfig[]): string => {
    const component = configs.find((c) => c.id === componentId);
    return component ? `${component.name} (${component.component})` : "";
  };

  const { nodes, edges } = useMemo(() => {
    const nodes: Node<StreamNodeData>[] = [];
    const edges: Edge[] = [];

    // Create input node
    const inputNode: Node<StreamNodeData> = {
      id: uuidv4(),
      type: "streamNode",
      position: { x: 100, y: 100 },
      data: {
        label: stream.inputLabel || "Input",
        type: "input",
        component: getComponentLabel(stream.inputID.toString(), componentConfigs),
        componentId: stream.inputID.toString(),
        status: stream.status,
      },
    };
    nodes.push(inputNode);

    // Create processor nodes
    let lastNodeId = inputNode.id;
    if (stream.processors && stream.processors.length > 0) {
      stream.processors.forEach((processor, index) => {
        const processorNode: Node<StreamNodeData> = {
          id: uuidv4(),
          type: "streamNode",
          position: { x: 400, y: 100 + index * 150 },
          data: {
            label: processor.label || `Processor ${index + 1}`,
            type: "processor",
            component: getComponentLabel(processor.processorID.toString(), componentConfigs),
            componentId: processor.processorID.toString(),
            status: stream.status,
          },
        };
        nodes.push(processorNode);

        // Connect to previous node
        edges.push({
          id: `e-${lastNodeId}-${processorNode.id}`,
          source: lastNodeId,
          target: processorNode.id,
          animated: true,
        });

        lastNodeId = processorNode.id;
      });
    }

    // Create output node
    const outputNode: Node<StreamNodeData> = {
      id: uuidv4(),
      type: "streamNode",
      position: { x: 700, y: 100 },
      data: {
        label: stream.outputLabel || "Output",
        type: "output",
        component: getComponentLabel(stream.outputID.toString(), componentConfigs),
        componentId: stream.outputID.toString(),
        status: stream.status,
      },
    };
    nodes.push(outputNode);

    // Connect to last processor or input
    edges.push({
      id: `e-${lastNodeId}-${outputNode.id}`,
      source: lastNodeId,
      target: outputNode.id,
      animated: true,
    });

    return { nodes, edges };
  }, [stream, componentConfigs]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={{ streamNode: StreamNode }}
      fitView
      attributionPosition="bottom-right"
      zoomOnScroll={false}
      panOnScroll={true}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
