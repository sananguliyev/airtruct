"use client";

import { useEffect, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import { componentConfigsData } from "@/lib/mock-data";
import StreamNode, { type StreamNodeData } from "./stream-node";
import { v4 as uuidv4 } from "uuid";

interface StreamPreviewProps {
  stream: any;
}

export default function StreamPreview({ stream }: StreamPreviewProps) {
  const [nodes, setNodes] = useState<Node<StreamNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    // If the stream has visual data, use it
    if (stream.visualData) {
      setNodes(stream.visualData.nodes);
      setEdges(stream.visualData.edges);
    } else {
      // Otherwise, create visual data from the stream configuration
      const newNodes: Node<StreamNodeData>[] = [];
      const newEdges: Edge[] = [];

      // Create input node
      const inputNode: Node<StreamNodeData> = {
        id: uuidv4(),
        type: "streamNode",
        position: { x: 100, y: 100 },
        data: {
          label: stream.inputLabel || "Input",
          type: "input",
          component: getComponentLabel(stream.inputComponentId),
          componentId: stream.inputComponentId,
          status: stream.status,
        },
      };
      newNodes.push(inputNode);

      // Create processor nodes
      let lastNodeId = inputNode.id;
      if (stream.processors && stream.processors.length > 0) {
        stream.processors.forEach((processor: any, index: number) => {
          const processorNode: Node<StreamNodeData> = {
            id: processor.id || uuidv4(),
            type: "streamNode",
            position: { x: 400, y: 100 + index * 150 },
            data: {
              label: processor.label || `Processor ${index + 1}`,
              type: "processor",
              component: getComponentLabel(processor.component_id),
              componentId: processor.component_id,
              status: stream.status,
            },
          };
          newNodes.push(processorNode);

          // Connect to previous node
          newEdges.push({
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
          component: getComponentLabel(stream.outputComponentId),
          componentId: stream.outputComponentId,
          status: stream.status,
        },
      };
      newNodes.push(outputNode);

      // Connect to last processor or input
      newEdges.push({
        id: `e-${lastNodeId}-${outputNode.id}`,
        source: lastNodeId,
        target: outputNode.id,
        animated: true,
      });

      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [stream]);

  // Helper to get component label from ID
  const getComponentLabel = (componentId: string): string => {
    const component = componentConfigsData.find((c) => c.id === componentId);
    return component ? `${component.label} (${component.component})` : "";
  };

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
