import type React from "react";

import { useCallback, useState, useRef, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Save, Database, Cog, ArrowRightLeft, Trash2 } from "lucide-react";
import StreamNode, { type StreamNodeData } from "./stream-node";
import { NodeConfigPanel } from "./node-config-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentConfig } from "@/lib/entities";

// Define node types
const nodeTypes: NodeTypes = {
  streamNode: StreamNode,
};

interface StreamBuilderProps {
  componentConfigsData: ComponentConfig[];
  initialData?: {
    name: string;
    status: string;
    nodes: Node<StreamNodeData>[];
    edges: Edge[];
  };
  onSave: (data: {
    name: string;
    status: string;
    nodes: Node<StreamNodeData>[];
    edges: Edge[];
  }) => void;
}

function StreamBuilderContent({
  componentConfigsData,
  initialData,
  onSave,
}: StreamBuilderProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { setViewport } = useReactFlow();

  useEffect(() => {
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, [setViewport]);
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialData?.nodes || []
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    initialData?.edges || []
  );
  const [selectedNode, setSelectedNode] = useState<Node<StreamNodeData> | null>(
    null
  );
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [name, setName] = useState(initialData?.name || "");
  const [status, setStatus] = useState(initialData?.status || "active");

  const { project } = useReactFlow();

  // Connect nodes
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<StreamNodeData>);
    setSelectedEdge(null);
  }, []);

  // Handle edge selection
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  // Handle background click to deselect nodes and edges
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  // Update node data
  const handleUpdateNode = useCallback(
    (nodeId: string, data: StreamNodeData) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return { ...node, data };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  // Delete node
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId)
      );
      setSelectedNode(null);
    },
    [setNodes, setEdges]
  );

  // Delete edge
  const handleDeleteEdge = useCallback(() => {
    if (selectedEdge) {
      setEdges((eds) => eds.filter((edge) => edge.id !== selectedEdge.id));
      setSelectedEdge(null);
    }
  }, [selectedEdge, setEdges]);

  // Add new node
  const addNode = useCallback(
    (type: "input" | "processor" | "output") => {
      const newNode: Node<StreamNodeData> = {
        id: uuidv4(),
        type: "streamNode",
        position: {
          x: type === "input" ? 100 : type === "processor" ? 400 : 700,
          y: 100 + nodes.filter((n) => n.data.type === type).length * 150,
        },
        data: {
          label: `new_${type}`,
          type,
          componentId: "", // Initialize with empty componentId
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [nodes, setNodes]
  );

  // Handle save
  const handleSave = useCallback(() => {
    onSave({
      name,
      status,
      nodes,
      edges,
    });
  }, [name, status, nodes, edges, onSave]);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="flex space-x-4 mb-4">
        <div className="flex-1">
          <Label htmlFor="stream-name">Stream Name</Label>
          <Input
            id="stream-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter stream name"
            className="mb-2"
          />
        </div>
        <div className="w-48">
          <Label htmlFor="stream-status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-1 gap-4">
        <div
          className="flex-1 border rounded-md overflow-hidden"
          ref={reactFlowWrapper}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView={false}
            snapToGrid
            snapGrid={[15, 15]}
            edgesFocusable={true}
            selectNodesOnDrag={false}
          >
            <Background />
            <Controls />
            <MiniMap />
            <Panel position="top-right" className="flex gap-2">
              <Button
                size="sm"
                onClick={() => addNode("input")}
                className="flex items-center gap-1"
              >
                <Database className="h-4 w-4" />
                Add Input
              </Button>
              <Button
                size="sm"
                onClick={() => addNode("processor")}
                className="flex items-center gap-1"
              >
                <Cog className="h-4 w-4" />
                Add Processor
              </Button>
              <Button
                size="sm"
                onClick={() => addNode("output")}
                className="flex items-center gap-1"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Add Output
              </Button>
            </Panel>
          </ReactFlow>
        </div>

        <div className="w-80">
          {selectedNode ? (
            <NodeConfigPanel
              componentConfigsData={componentConfigsData}
              selectedNode={selectedNode}
              onUpdateNode={handleUpdateNode}
              onDeleteNode={handleDeleteNode}
            />
          ) : selectedEdge ? (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Connection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  This connection links nodes in your stream. You can delete it
                  to break the connection.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleDeleteEdge}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Connection
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full">
              <CardHeader>
                <CardTitle>Stream Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Click on a node or connection to configure it. Drag between
                  node handles to create connections.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button
          onClick={handleSave}
          disabled={!name || nodes.length === 0}
          className="flex items-center gap-1"
        >
          <Save className="h-4 w-4" />
          Save Stream
        </Button>
      </div>
    </div>
  );
}

// Wrap with provider
export function StreamBuilder(props: StreamBuilderProps) {
  return (
    <ReactFlowProvider>
      <StreamBuilderContent {...props} />
    </ReactFlowProvider>
  );
}
