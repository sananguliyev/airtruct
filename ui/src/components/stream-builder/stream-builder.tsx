import { useCallback, useState, useEffect, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  useReactFlow,
  addEdge,
  MarkerType,
  type Connection,
  type Node,
  type Edge,
  type ColorMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import {
  Save,
  ShieldCheck,
  FlaskConical,
  Loader2,
  Plus,
  X,
  XCircle,
  Download,
  Workflow,
  Upload,
} from "lucide-react";
import {
  NodeConfigPanel,
  type AllComponentSchemas,
} from "./node-config-panel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/toast";
import { fetchBuffers } from "@/lib/api";
import type { Buffer } from "@/lib/entities";
import * as yaml from "js-yaml";

import { InputNode } from "./nodes/input-node";
import { ProcessorNode } from "./nodes/processor-node";
import { OutputNode } from "./nodes/output-node";
import { PipelineEdge } from "./edges/pipeline-edge";

// --- Exported types (unchanged for compatibility) ---
export interface StreamNodeData {
  label: string;
  type: "input" | "processor" | "output";
  componentId?: string;
  component?: string;
  configYaml?: string;
}

export interface SectionNodeData {
  label: string;
  type: "input" | "processor" | "output";
}

export interface CustomNode {
  id: string;
  type: "input" | "processor" | "output";
  parentId: string;
  data: StreamNodeData;
}

export interface CustomSection {
  id: string;
  type: "input" | "processor" | "output";
  label: string;
  nodes: CustomNode[];
  data: SectionNodeData;
}

// --- Internal types ---
export interface StreamFlowNodeData extends Record<string, unknown> {
  label: string;
  type: "input" | "processor" | "output";
  componentId?: string;
  component?: string;
  configYaml?: string;
  disconnected?: boolean;
  nodeId: string;
  onAddAndConnect?: (sourceNodeId: string, sourceType: string) => void;
  onAddBefore?: (targetNodeId: string) => void;
}

type ValidationResult = { valid: boolean; error?: string } | null;

type TryStreamResult = {
  outputs: Array<{ content: string }>;
  error?: string;
};

interface StreamBuilderProps {
  allComponentSchemas: AllComponentSchemas;
  initialData?: {
    name: string;
    status: string;
    bufferId?: number;
    nodes: StreamNodeData[];
  };
  onSave: (data: {
    name: string;
    status: string;
    bufferId?: number;
    nodes: StreamNodeData[];
  }) => void;
  onValidate?: (data: {
    name: string;
    status: string;
    bufferId?: number;
    nodes: StreamNodeData[];
  }) => Promise<ValidationResult>;
  onTry?: (data: {
    processors: Array<{ label: string; component: string; config: string }>;
    messages: Array<{ content: string }>;
  }) => Promise<TryStreamResult>;
}

const nodeTypes = {
  inputNode: InputNode,
  processorNode: ProcessorNode,
  outputNode: OutputNode,
};

const edgeTypes = {
  pipeline: PipelineEdge,
};

const NODE_SPACING_X = 350;
const NODE_Y = 200;

function toFlowNodeType(type: "input" | "processor" | "output"): string {
  if (type === "input") return "inputNode";
  if (type === "processor") return "processorNode";
  return "outputNode";
}

function StreamBuilderContent({
  allComponentSchemas,
  initialData,
  onSave,
  onValidate,
  onTry,
}: StreamBuilderProps) {
  const { addToast } = useToast();
  const { fitView } = useReactFlow();

  const [name, setName] = useState(initialData?.name || "");
  const [status, setStatus] = useState(initialData?.status || "active");
  const [bufferId, setBufferId] = useState<number | undefined>(initialData?.bufferId);
  const [availableBuffers, setAvailableBuffers] = useState<Buffer[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [tryDialogOpen, setTryDialogOpen] = useState(false);
  const [tryMessages, setTryMessages] = useState<string[]>([""]);
  const [tryResult, setTryResult] = useState<TryStreamResult | null>(null);
  const [isTrying, setIsTrying] = useState(false);
  const [colorMode, setColorMode] = useState<ColorMode>("light");

  useEffect(() => {
    fetchBuffers().then(setAvailableBuffers).catch(() => setAvailableBuffers([]));
  }, []);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setColorMode(isDark ? "dark" : "light");
    const observer = new MutationObserver(() => {
      setColorMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  // Build initial nodes and edges from initialData
  const [initialFlowNodes, initialFlowEdges] = useMemo(() => {
    if (!initialData?.nodes || initialData.nodes.length === 0) return [[], []];

    const inputNodes = initialData.nodes.filter((n) => n.type === "input");
    const processorNodes = initialData.nodes.filter((n) => n.type === "processor");
    const outputNodes = initialData.nodes.filter((n) => n.type === "output");

    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    let xPos = 0;
    let prevNodeId: string | null = null;

    for (const nd of inputNodes) {
      const id = uuidv4();
      flowNodes.push({
        id,
        type: "inputNode",
        position: { x: xPos, y: NODE_Y },
        data: { ...nd, nodeId: id },
      });
      prevNodeId = id;
      xPos += NODE_SPACING_X;
    }

    for (const nd of processorNodes) {
      const id = uuidv4();
      flowNodes.push({
        id,
        type: "processorNode",
        position: { x: xPos, y: NODE_Y },
        data: { ...nd, nodeId: id },
      });
      if (prevNodeId) {
        flowEdges.push({
          id: `e-${prevNodeId}-${id}`,
          source: prevNodeId,
          target: id,
          type: "pipeline",
        });
      }
      prevNodeId = id;
      xPos += NODE_SPACING_X;
    }

    for (const nd of outputNodes) {
      const id = uuidv4();
      flowNodes.push({
        id,
        type: "outputNode",
        position: { x: xPos, y: NODE_Y },
        data: { ...nd, nodeId: id },
      });
      if (prevNodeId) {
        flowEdges.push({
          id: `e-${prevNodeId}-${id}`,
          source: prevNodeId,
          target: id,
          type: "pipeline",
        });
      }
    }

    return [flowNodes, flowEdges];
  }, []); // Only compute once on mount

  const [nodes, setNodes, onNodesChange] = useNodesState(initialFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialFlowEdges);

  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setEdges((eds) => eds.filter((e) => e.id !== edgeId));
      setNodes((nds) =>
        nds.map((n) =>
          (n.data as StreamFlowNodeData).disconnected
            ? { ...n, data: { ...n.data, disconnected: false } }
            : n
        )
      );
    },
    [setEdges, setNodes]
  );

  // Clear disconnected state when edges change
  const handleEdgesChange: typeof onEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes);
      setNodes((nds) =>
        nds.map((n) =>
          (n.data as StreamFlowNodeData).disconnected
            ? { ...n, data: { ...n.data, disconnected: false } }
            : n
        )
      );
    },
    [onEdgesChange, setNodes]
  );

  const scheduleAutoFit = useCallback(() => {
    setTimeout(() => fitView({ padding: 0.2, duration: 300 }), 50);
  }, [fitView]);

  const handleAddAndConnect = useCallback(
    (sourceNodeId: string, _sourceType: string) => {
      const sourceNode = nodes.find((n) => n.id === sourceNodeId);
      if (!sourceNode) return;

      const newId = uuidv4();
      const insertX = sourceNode.position.x + NODE_SPACING_X;
      const label = `new_processor_${nodes.filter((n) => (n.data as StreamFlowNodeData).type === "processor").length + 1}`;

      const newNode: Node = {
        id: newId,
        type: "processorNode",
        position: { x: insertX, y: sourceNode.position.y },
        data: {
          label,
          type: "processor",
          componentId: "",
          component: "",
          configYaml: "",
          nodeId: newId,
        } satisfies Partial<StreamFlowNodeData>,
      };

      // Shift all nodes to the right of insertX further right
      setNodes((nds) => [
        ...nds.map((n) =>
          n.id !== sourceNodeId && n.position.x >= insertX
            ? { ...n, position: { ...n.position, x: n.position.x + NODE_SPACING_X } }
            : n
        ),
        newNode,
      ]);
      setEdges((eds) => {
        const existingOutgoing = eds.find((e) => e.source === sourceNodeId);
        const filtered = existingOutgoing
          ? eds.filter((e) => e.id !== existingOutgoing.id)
          : eds;

        const newEdges = [
          ...filtered,
          { id: `e-${sourceNodeId}-${newId}`, source: sourceNodeId, target: newId, type: "pipeline" } as Edge,
        ];

        if (existingOutgoing) {
          newEdges.push({
            id: `e-${newId}-${existingOutgoing.target}`,
            source: newId,
            target: existingOutgoing.target,
            type: "pipeline",
          } as Edge);
        }

        return newEdges;
      });
      setSelectedNodeId(newId);
      scheduleAutoFit();
    },
    [nodes, setNodes, setEdges, scheduleAutoFit]
  );

  const handleAddBefore = useCallback(
    (targetNodeId: string) => {
      const targetNode = nodes.find((n) => n.id === targetNodeId);
      if (!targetNode) return;

      const newId = uuidv4();
      const insertX = targetNode.position.x;
      const label = `new_processor_${nodes.filter((n) => (n.data as StreamFlowNodeData).type === "processor").length + 1}`;

      const newNode: Node = {
        id: newId,
        type: "processorNode",
        position: { x: insertX, y: targetNode.position.y },
        data: {
          label,
          type: "processor",
          componentId: "",
          component: "",
          configYaml: "",
          nodeId: newId,
        } satisfies Partial<StreamFlowNodeData>,
      };

      // Shift target and all nodes at or right of insertX further right
      setNodes((nds) => [
        ...nds.map((n) =>
          n.position.x >= insertX
            ? { ...n, position: { ...n.position, x: n.position.x + NODE_SPACING_X } }
            : n
        ),
        newNode,
      ]);
      setEdges((eds) => {
        const existingIncoming = eds.find((e) => e.target === targetNodeId);
        const filtered = existingIncoming
          ? eds.filter((e) => e.id !== existingIncoming.id)
          : eds;

        const newEdges = [
          ...filtered,
          { id: `e-${newId}-${targetNodeId}`, source: newId, target: targetNodeId, type: "pipeline" } as Edge,
        ];

        if (existingIncoming) {
          newEdges.push({
            id: `e-${existingIncoming.source}-${newId}`,
            source: existingIncoming.source,
            target: newId,
            type: "pipeline",
          } as Edge);
        }

        return newEdges;
      });
      setSelectedNodeId(newId);
      scheduleAutoFit();
    },
    [nodes, setNodes, setEdges, scheduleAutoFit]
  );

  // Inject callbacks into node data
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        nodeId: n.id,
        onAddAndConnect: handleAddAndConnect,
        onAddBefore: handleAddBefore,
      },
    }));
  }, [nodes, handleAddAndConnect, handleAddBefore]);

  const edgesWithCallbacks = useMemo(() => {
    return edges.map((e) => ({
      ...e,
      data: { ...e.data, onDeleteEdge: handleDeleteEdge },
      markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
    }));
  }, [edges, handleDeleteEdge]);

  const isValidConnection = useCallback(
    (connection: Edge | Connection) => {
      // No self-connections
      if (connection.source === connection.target) return false;

      const source = nodes.find((n) => n.id === connection.source);
      const target = nodes.find((n) => n.id === connection.target);
      if (!source || !target) return false;

      // Each source can only have one outgoing edge
      const hasOutgoing = edges.some((e) => e.source === connection.source);
      if (hasOutgoing) return false;

      // Each target can only have one incoming edge
      const hasIncoming = edges.some((e) => e.target === connection.target);
      if (hasIncoming) return false;

      const st = (source.data as StreamFlowNodeData).type;
      const tt = (target.data as StreamFlowNodeData).type;
      if (st === "input" && (tt === "processor" || tt === "output")) return true;
      if (st === "processor" && (tt === "processor" || tt === "output")) return true;
      return false;
    },
    [nodes, edges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Remove any existing outgoing edge from source and incoming edge to target
      setEdges((eds) => {
        const filtered = eds.filter(
          (e) => e.source !== params.source && e.target !== params.target
        );
        return addEdge({ ...params, type: "pipeline" }, filtered);
      });
    },
    [setEdges]
  );

  const handleAddNode = useCallback(
    (type: "input" | "processor" | "output") => {
      const existingOfType = nodes.filter((n) => (n.data as StreamFlowNodeData).type === type);
      if (type === "input" && existingOfType.length > 0) {
        addToast({ id: "input-exists", title: "Input Exists", description: "Only one input node allowed.", variant: "info" });
        return;
      }
      if (type === "output" && existingOfType.length > 0) {
        addToast({ id: "output-exists", title: "Output Exists", description: "Only one output node allowed.", variant: "info" });
        return;
      }

      const newId = uuidv4();
      let xPos = 50;
      let label = `new_${type}`;

      if (type === "input") {
        xPos = 0;
      } else if (type === "output") {
        xPos = Math.max(...nodes.map((n) => n.position.x), 0) + NODE_SPACING_X;
      } else {
        label = `new_processor_${existingOfType.length + 1}`;
        const processorCount = existingOfType.length;
        xPos = NODE_SPACING_X + processorCount * NODE_SPACING_X;
      }

      const yOffset = nodes.filter((n) => Math.abs(n.position.x - xPos) < 100).length * 100;

      const newNode: Node = {
        id: newId,
        type: toFlowNodeType(type),
        position: { x: xPos, y: NODE_Y + yOffset },
        data: {
          label,
          type,
          componentId: "",
          component: "",
          configYaml: "",
          nodeId: newId,
        } satisfies Partial<StreamFlowNodeData>,
      };

      setNodes((nds) => [...nds, newNode]);
      setSelectedNodeId(newId);
      scheduleAutoFit();
    },
    [nodes, setNodes, addToast, scheduleAutoFit]
  );

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const selectedNode = useMemo(() => {
    const n = nodes.find((n) => n.id === selectedNodeId);
    if (!n) return null;
    const d = n.data as StreamFlowNodeData;
    return {
      id: n.id,
      data: {
        label: d.label,
        type: d.type,
        componentId: d.componentId,
        component: d.component,
        configYaml: d.configYaml,
      } as StreamNodeData,
    };
  }, [nodes, selectedNodeId]);

  const isMcpServer = useMemo(
    () => nodes.some((n) => (n.data as StreamFlowNodeData).type === "input" && (n.data as StreamFlowNodeData).componentId === "mcp_tool"),
    [nodes]
  );

  const handleUpdateNode = useCallback(
    (nodeId: string, data: StreamNodeData) => {
      setNodes((nds) => {
        // Clear disconnected state on all nodes when any config changes
        let updated = nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, ...data, nodeId: n.id, disconnected: false } }
            : (n.data as StreamFlowNodeData).disconnected
              ? { ...n, data: { ...n.data, disconnected: false } }
              : n
        );

        if (data.type === "input" && data.componentId === "mcp_tool") {
          const outputNode = updated.find((n) => (n.data as StreamFlowNodeData).type === "output");
          if (outputNode) {
            if (
              (outputNode.data as StreamFlowNodeData).componentId !== "sync_response" ||
              (outputNode.data as StreamFlowNodeData).label !== "mcp_tool_response"
            ) {
              updated = updated.map((n) =>
                n.id === outputNode.id
                  ? { ...n, data: { ...n.data, label: "mcp_tool_response", componentId: "sync_response", component: "sync_response", configYaml: "" } }
                  : n
              );
            }
          } else {
            const newId = uuidv4();
            const maxX = Math.max(...updated.map((n) => n.position.x), 0);
            updated.push({
              id: newId,
              type: "outputNode",
              position: { x: maxX + NODE_SPACING_X, y: NODE_Y },
              data: { label: "mcp_tool_response", type: "output", componentId: "sync_response", component: "sync_response", configYaml: "", nodeId: newId },
            });
            const sourceNode = [...updated]
              .filter((n) => (n.data as StreamFlowNodeData).type !== "output")
              .sort((a, b) => b.position.x - a.position.x)[0];
            if (sourceNode) {
              setEdges((eds) => [
                ...eds,
                { id: `e-${sourceNode.id}-${newId}`, source: sourceNode.id, target: newId, type: "pipeline" },
              ]);
            }
          }
        }

        return updated;
      });
    },
    [setNodes, setEdges]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
      if (selectedNodeId === nodeId) setSelectedNodeId(null);
    },
    [setNodes, setEdges, selectedNodeId]
  );

  const validateRequiredFields = useCallback(
    (nodeData: StreamNodeData): { isValid: boolean; missingFields: string[]; error?: string } => {
      if (!nodeData.componentId) {
        return { isValid: false, missingFields: ["component selection"] };
      }

      const component = allComponentSchemas[nodeData.type]?.find((c) => c.id === nodeData.componentId);
      const schema = component?.schema || {};
      const properties = schema.properties || {};

      if (Object.keys(properties).length === 0) {
        return { isValid: true, missingFields: [] };
      }

      let configData: any = {};
      if (nodeData.configYaml && nodeData.configYaml.trim()) {
        try {
          configData = yaml.load(nodeData.configYaml) || {};
        } catch {
          return { isValid: false, missingFields: [], error: "Invalid YAML format" };
        }
      }

      const missingFields: string[] = [];

      if (schema.flat === true) {
        const hasContent =
          Object.keys(configData).length > 0 ||
          (Array.isArray(configData) && configData.length > 0) ||
          (typeof configData === "string" && configData.trim().length > 0);
        if (!hasContent) {
          Object.entries(properties).forEach(([fieldKey, fieldSchema]) => {
            if ((fieldSchema as any).required === true && missingFields.length === 0) {
              missingFields.push(fieldKey);
            }
          });
        }
      } else {
        Object.entries(properties).forEach(([fieldKey, fieldSchema]) => {
          if ((fieldSchema as any).required === true) {
            const value = configData[fieldKey];
            if (value === undefined || value === null || value === "") {
              missingFields.push(fieldKey);
            }
          }
        });
      }

      return { isValid: missingFields.length === 0, missingFields };
    },
    [allComponentSchemas]
  );

  const findDisconnectedNodes = useCallback((): Set<string> => {
    if (nodes.length === 0) return new Set();

    const adj = new Map<string, string[]>();
    const radj = new Map<string, string[]>();
    for (const n of nodes) {
      adj.set(n.id, []);
      radj.set(n.id, []);
    }
    for (const e of edges) {
      adj.get(e.source)?.push(e.target);
      radj.get(e.target)?.push(e.source);
    }

    const inputNode = nodes.find((n) => (n.data as StreamFlowNodeData).type === "input");
    const outputNode = nodes.find((n) => (n.data as StreamFlowNodeData).type === "output");

    if (!inputNode || !outputNode) return new Set(nodes.map((n) => n.id));

    const forwardReachable = new Set<string>();
    const queue = [inputNode.id];
    forwardReachable.add(inputNode.id);
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const next of adj.get(curr) || []) {
        if (!forwardReachable.has(next)) {
          forwardReachable.add(next);
          queue.push(next);
        }
      }
    }

    const backwardReachable = new Set<string>();
    const bQueue = [outputNode.id];
    backwardReachable.add(outputNode.id);
    while (bQueue.length > 0) {
      const curr = bQueue.shift()!;
      for (const prev of radj.get(curr) || []) {
        if (!backwardReachable.has(prev)) {
          backwardReachable.add(prev);
          bQueue.push(prev);
        }
      }
    }

    const disconnected = new Set<string>();
    for (const n of nodes) {
      if (!forwardReachable.has(n.id) || !backwardReachable.has(n.id)) {
        disconnected.add(n.id);
      }
    }

    return disconnected;
  }, [nodes, edges]);

  const handleValidate = useCallback(async () => {
    if (!onValidate) return;
    setIsValidating(true);
    try {
      const nodeDataList = nodes.map((n) => {
        const d = n.data as StreamFlowNodeData;
        return { label: d.label, type: d.type, componentId: d.componentId, component: d.component, configYaml: d.configYaml } as StreamNodeData;
      });
      const result = await onValidate({ name, status, bufferId, nodes: nodeDataList });
      if (result?.valid) {
        addToast({ id: "validate-ok", title: "Valid", description: "Configuration is valid.", variant: "success", duration: 3000 });
      } else {
        addToast({ id: "validate-err", title: "Invalid", description: result?.error || "Configuration is invalid.", variant: "error", duration: 5000 });
      }
    } catch {
      addToast({ id: "validate-fail", title: "Error", description: "Failed to reach validation endpoint.", variant: "error" });
    } finally {
      setIsValidating(false);
    }
  }, [onValidate, name, status, bufferId, nodes, addToast]);

  const handleTrySubmit = useCallback(async () => {
    if (!onTry) return;
    const nonEmpty = tryMessages.filter((m) => m.trim());
    if (nonEmpty.length === 0) {
      addToast({ id: "try-no-msg", title: "No Messages", description: "Enter at least one test message.", variant: "warning" });
      return;
    }
    setIsTrying(true);
    setTryResult(null);
    try {
      const processorNodes = nodes.filter((n) => (n.data as StreamFlowNodeData).type === "processor");
      const processors = processorNodes.map((n) => {
        const d = n.data as StreamFlowNodeData;
        const comp = allComponentSchemas.processor.find((c) => c.id === d.componentId);
        return { label: d.label, component: comp?.component || d.componentId || "", config: d.configYaml || "" };
      });
      const result = await onTry({ processors, messages: nonEmpty.map((content) => ({ content })) });
      setTryResult(result);
    } catch {
      setTryResult({ outputs: [], error: "Failed to reach try endpoint." });
    } finally {
      setIsTrying(false);
    }
  }, [onTry, tryMessages, nodes, allComponentSchemas, addToast]);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      addToast({ id: "name-req", title: "Validation Error", description: "Stream name is required.", variant: "warning" });
      return;
    }

    const inputNode = nodes.find((n) => (n.data as StreamFlowNodeData).type === "input");
    const outputNode = nodes.find((n) => (n.data as StreamFlowNodeData).type === "output");

    if (!inputNode) {
      addToast({ id: "input-req", title: "Validation Error", description: "An input node is required.", variant: "warning" });
      return;
    }
    if (!outputNode) {
      addToast({ id: "output-req", title: "Validation Error", description: "An output node is required.", variant: "warning" });
      return;
    }

    const disconnected = findDisconnectedNodes();
    if (disconnected.size > 0) {
      setNodes((nds) =>
        nds.map((n) =>
          disconnected.has(n.id)
            ? { ...n, data: { ...n.data, disconnected: true } }
            : { ...n, data: { ...n.data, disconnected: false } }
        )
      );
      addToast({
        id: "disconnected",
        title: "Disconnected Nodes",
        description: `${disconnected.size} node(s) are not connected to the pipeline. Connect all nodes before saving.`,
        variant: "warning",
        duration: 5000,
      });
      return;
    }

    for (const n of nodes) {
      const d = n.data as StreamFlowNodeData;
      const nodeData: StreamNodeData = { label: d.label, type: d.type, componentId: d.componentId, component: d.component, configYaml: d.configYaml };
      const validation = validateRequiredFields(nodeData);
      if (!validation.isValid) {
        const errorMessage = validation.error || `Missing required fields: ${validation.missingFields.join(", ")}`;
        addToast({
          id: `validation-${n.id}`,
          title: `${d.type.charAt(0).toUpperCase() + d.type.slice(1)} Validation Error`,
          description: `"${d.label}" - ${errorMessage}`,
          variant: "warning",
        });
        return;
      }
    }

    // Build ordered node data: input, processors in edge-order, output
    const orderedNodes: StreamNodeData[] = [];

    const inputD = inputNode.data as StreamFlowNodeData;
    orderedNodes.push({ label: inputD.label, type: inputD.type, componentId: inputD.componentId, component: inputD.component, configYaml: inputD.configYaml });

    // Walk edges from input to output
    const adj = new Map<string, string>();
    for (const e of edges) {
      adj.set(e.source, e.target);
    }
    let current = adj.get(inputNode.id);
    while (current && current !== outputNode.id) {
      const node = nodes.find((n) => n.id === current);
      if (node) {
        const d = node.data as StreamFlowNodeData;
        orderedNodes.push({ label: d.label, type: d.type, componentId: d.componentId, component: d.component, configYaml: d.configYaml });
      }
      current = adj.get(current!);
    }

    const outputD = outputNode.data as StreamFlowNodeData;
    orderedNodes.push({ label: outputD.label, type: outputD.type, componentId: outputD.componentId, component: outputD.component, configYaml: outputD.configYaml });

    onSave({ name, status, bufferId, nodes: orderedNodes });
  }, [name, status, bufferId, nodes, edges, onSave, addToast, findDisconnectedNodes, validateRequiredFields, setNodes]);

  const hasInput = nodes.some((n) => (n.data as StreamFlowNodeData).type === "input");
  const hasOutput = nodes.some((n) => (n.data as StreamFlowNodeData).type === "output");
  const hasProcessors = nodes.some((n) => (n.data as StreamFlowNodeData).type === "processor");

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full">
      {/* Top bar */}
      <div className="flex items-end gap-4 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="stream-name">Stream Name</Label>
          <Input id="stream-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter stream name" />
        </div>
        <div className="w-40">
          <Label htmlFor="stream-status">Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Label htmlFor="stream-buffer">Buffer</Label>
          <Select
            value={bufferId ? String(bufferId) : "none"}
            onValueChange={(val) => setBufferId(val === "none" ? undefined : Number(val))}
          >
            <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {availableBuffers.map((buffer) => (
                <SelectItem key={buffer.id} value={buffer.id}>{buffer.label} ({buffer.component})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {onValidate && (
          <Button variant="outline" onClick={handleValidate} disabled={isValidating || !hasInput || !hasOutput} className="flex items-center gap-1">
            <ShieldCheck className="h-4 w-4" />
            {isValidating ? "Validating..." : "Validate"}
          </Button>
        )}
        {onTry && (
          <Button variant="outline" onClick={() => { setTryResult(null); setTryDialogOpen(true); }} disabled={!hasProcessors} className="flex items-center gap-1">
            <FlaskConical className="h-4 w-4" />
            Try
          </Button>
        )}
        <Button onClick={handleSave} disabled={!name.trim() || !hasInput || !hasOutput} className="flex items-center gap-1">
          <Save className="h-4 w-4" /> Save
        </Button>
      </div>

      {/* Canvas (full width) */}
      <div className="flex-1 w-full h-full min-h-0 rounded-md border bg-background overflow-hidden">
        <ReactFlow
          nodes={nodesWithCallbacks}
          edges={edgesWithCallbacks}
          onNodesChange={onNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          isValidConnection={isValidConnection}
          fitView
          colorMode={colorMode}
          defaultEdgeOptions={{ type: "pipeline" }}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} size={1} />
          <Controls />
          <Panel position="top-left" className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddNode("input")}
              disabled={hasInput}
              className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm"
            >
              <Download className="h-3.5 w-3.5 text-green-500" />
              Input
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddNode("processor")}
              className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm"
            >
              <Workflow className="h-3.5 w-3.5 text-blue-500" />
              Processor
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddNode("output")}
              disabled={hasOutput}
              className="flex items-center gap-1.5 bg-background/80 backdrop-blur-sm"
            >
              <Upload className="h-3.5 w-3.5 text-amber-500" />
              Output
            </Button>
          </Panel>
        </ReactFlow>
      </div>

      {/* Config drawer */}
      <Sheet open={!!selectedNodeId} onOpenChange={(open) => { if (!open) setSelectedNodeId(null); }}>
        <SheetContent side="right" className="w-[420px] sm:max-w-[420px] overflow-y-auto p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Node Configuration</SheetTitle>
            <SheetDescription>Configure the selected node</SheetDescription>
          </SheetHeader>
          <div className="p-6 h-full">
            <NodeConfigPanel
              key={selectedNodeId || "none"}
              allComponentSchemas={allComponentSchemas}
              selectedNode={selectedNode}
              onUpdateNode={handleUpdateNode}
              onDeleteNode={handleDeleteNode}
              lockedComponentId={
                selectedNode?.data.type === "output" && isMcpServer ? "sync_response" : undefined
              }
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Try Stream Dialog */}
      <Dialog open={tryDialogOpen} onOpenChange={(open) => { if (!open) setTryDialogOpen(false); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Try Stream Processors</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium">Input Messages</Label>
                <Button variant="outline" size="sm" onClick={() => setTryMessages([...tryMessages, ""])} className="flex items-center gap-1 h-7 text-xs">
                  <Plus className="h-3 w-3" /> Add Message
                </Button>
              </div>
              <div className="space-y-2">
                {tryMessages.map((msg, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Textarea
                      value={msg}
                      onChange={(e) => {
                        const updated = [...tryMessages];
                        updated[idx] = e.target.value;
                        setTryMessages(updated);
                      }}
                      placeholder='{"key": "value"}'
                      className="font-mono text-sm min-h-[80px]"
                    />
                    {tryMessages.length > 1 && (
                      <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8 mt-1" onClick={() => setTryMessages(tryMessages.filter((_, i) => i !== idx))}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={handleTrySubmit} disabled={isTrying || !tryMessages.some((m) => m.trim())} className="w-full flex items-center justify-center gap-2">
              {isTrying ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Running...</>
              ) : (
                <><FlaskConical className="h-4 w-4" /> Run Test</>
              )}
            </Button>

            {tryResult && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Result</Label>
                {tryResult.error ? (
                  <div className="flex items-start gap-2 p-3 rounded-md border bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200 text-sm">
                    <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                    <pre className="whitespace-pre-wrap break-all font-mono text-xs flex-1">{tryResult.error}</pre>
                  </div>
                ) : !tryResult.outputs || tryResult.outputs.length === 0 ? (
                  <div className="p-3 rounded-md border bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200 text-sm">
                    No output produced. The message may have been filtered out by the processors.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tryResult.outputs.map((output, idx) => (
                      <div key={idx} className="rounded-md border bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
                        <div className="px-3 py-1.5 border-b border-green-200 dark:border-green-800">
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">Output {idx + 1}</span>
                        </div>
                        <pre className="p-3 text-sm font-mono whitespace-pre-wrap break-all text-green-900 dark:text-green-100">{output.content}</pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function StreamBuilder(props: StreamBuilderProps) {
  return (
    <ReactFlowProvider>
      <StreamBuilderContent {...props} />
    </ReactFlowProvider>
  );
}
