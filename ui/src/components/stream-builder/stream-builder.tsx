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
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/toast";
import { fetchBuffers } from "@/lib/api";
import type { Buffer } from "@/lib/entities";
import * as yaml from "js-yaml";

import { InputNode } from "./nodes/input-node";
import { ProcessorNode } from "./nodes/processor-node";
import { OutputNode } from "./nodes/output-node";
import { CatchGroupNode } from "./nodes/catch-group-node";
import { ChildProcessorNode } from "./nodes/child-processor-node";
import { BrokerGroupNode } from "./nodes/broker-group-node";
import { BrokerInputGroupNode } from "./nodes/broker-input-group-node";
import { ChildOutputNode } from "./nodes/child-output-node";
import { ChildInputNode } from "./nodes/child-input-node";
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
  readOnly?: boolean;
  nodeId: string;
  isGroup?: boolean;
  childCount?: number;
  brokerPattern?: string;
  onAddAndConnect?: (sourceNodeId: string, sourceType: string) => void;
  onAddBefore?: (targetNodeId: string) => void;
  onAddChildProcessor?: (groupId: string) => void;
  onAddChildOutput?: (groupId: string) => void;
  onAddChildInput?: (groupId: string) => void;
  childIndex?: number;
  parentBrokerPattern?: string;
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
    flowState?: string;
  };
  onSave: (data: {
    name: string;
    status: string;
    bufferId?: number;
    nodes: StreamNodeData[];
    flowState: string;
    isReady: boolean;
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
  catchGroupNode: CatchGroupNode,
  childProcessorNode: ChildProcessorNode,
  brokerGroupNode: BrokerGroupNode,
  brokerInputGroupNode: BrokerInputGroupNode,
  childOutputNode: ChildOutputNode,
  childInputNode: ChildInputNode,
};

const edgeTypes = {
  pipeline: PipelineEdge,
};

const NODE_SPACING_X = 350;
const NODE_Y = 200;

// Shared child node dimensions
const GROUP_WIDTH = 220;
const CHILD_NODE_WIDTH = 160;
const CHILD_NODE_HEIGHT = 72;
const CHILD_GAP_Y = 35;
const CHILD_X = Math.round((GROUP_WIDTH - CHILD_NODE_WIDTH) / 2);
const GROUP_BOTTOM_PAD = 50;

// Catch group layout
const CATCH_CHILD_Y_START = 68;
const CATCH_GROUP_MIN_HEIGHT = 140;

function calcCatchGroupHeight(childCount: number): number {
  if (childCount === 0) return CATCH_GROUP_MIN_HEIGHT;
  return CATCH_CHILD_Y_START + childCount * CHILD_NODE_HEIGHT + (childCount - 1) * CHILD_GAP_Y + GROUP_BOTTOM_PAD;
}

// Broker output group layout (taller header due to pattern line)
const BROKER_CHILD_Y_START = 96;
const BROKER_GROUP_MIN_HEIGHT = 170;

function calcBrokerGroupHeight(childCount: number): number {
  if (childCount === 0) return BROKER_GROUP_MIN_HEIGHT;
  return BROKER_CHILD_Y_START + childCount * CHILD_NODE_HEIGHT + (childCount - 1) * CHILD_GAP_Y + GROUP_BOTTOM_PAD;
}

// Broker input group layout (simpler header, no pattern)
const BROKER_INPUT_CHILD_Y_START = 68;
const BROKER_INPUT_GROUP_MIN_HEIGHT = 140;

function calcBrokerInputGroupHeight(childCount: number): number {
  if (childCount === 0) return BROKER_INPUT_GROUP_MIN_HEIGHT;
  return BROKER_INPUT_CHILD_Y_START + childCount * CHILD_NODE_HEIGHT + (childCount - 1) * CHILD_GAP_Y + GROUP_BOTTOM_PAD;
}

function isBrokerSequential(pattern: string | undefined): boolean {
  return pattern === "fan_out_sequential" || pattern === "fan_out_sequential_fail_fast";
}

function makeInternalEdgeData(): Record<string, unknown> {
  return { internal: true };
}

// Re-snap child positions and fix internal edges for groups
function reSnapChildren(flowNodes: Node[], flowEdges: Edge[]): void {
  const groupNodes = flowNodes.filter((n) => n.type === "catchGroupNode" || n.type === "brokerGroupNode" || n.type === "brokerInputGroupNode");
  for (const group of groupNodes) {
    const isBrokerOutput = group.type === "brokerGroupNode";
    const isBrokerInput = group.type === "brokerInputGroupNode";
    const yStart = isBrokerOutput ? BROKER_CHILD_Y_START : isBrokerInput ? BROKER_INPUT_CHILD_Y_START : CATCH_CHILD_Y_START;
    const children = flowNodes
      .filter((n) => n.parentId === group.id)
      .sort((a, b) => a.position.y - b.position.y);
    const pattern = isBrokerOutput ? (group.data as StreamFlowNodeData)?.brokerPattern : undefined;
    children.forEach((child, i) => {
      child.position = { x: CHILD_X, y: yStart + i * (CHILD_NODE_HEIGHT + CHILD_GAP_Y) };
      if (isBrokerOutput) {
        child.data = { ...child.data, childIndex: i, parentBrokerPattern: pattern };
      }
    });
    const calcHeight = isBrokerOutput ? calcBrokerGroupHeight : isBrokerInput ? calcBrokerInputGroupHeight : calcCatchGroupHeight;
    group.style = { ...group.style, width: GROUP_WIDTH, height: calcHeight(children.length) };

    // Fix internal edges: remove all, then re-add if sequential
    const childIds = new Set(children.map((c) => c.id));
    for (let i = flowEdges.length - 1; i >= 0; i--) {
      if ((flowEdges[i].data as any)?.internal && (childIds.has(flowEdges[i].source) || childIds.has(flowEdges[i].target))) {
        flowEdges.splice(i, 1);
      }
    }
    // Re-add if catch (always sequential) or broker output with sequential pattern
    // Broker input groups never have internal edges (all inputs merge in parallel)
    const shouldChain = isBrokerInput ? false : isBrokerOutput ? isBrokerSequential(pattern) : true;
    if (shouldChain && children.length > 1) {
      const edgeData = { internal: true };
      for (let i = 0; i < children.length - 1; i++) {
        flowEdges.push({
          id: `e-internal-${children[i].id}-${children[i + 1].id}`,
          source: children[i].id,
          target: children[i + 1].id,
          type: "pipeline",
          data: edgeData,
        });
      }
    }
  }
}

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
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const [deleteConfirmNodeId, setDeleteConfirmNodeId] = useState<string | null>(null);
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

  // Build initial nodes and edges from initialData (prefer saved flowState)
  const [initialFlowNodes, initialFlowEdges] = useMemo(() => {
    if (initialData?.flowState) {
      try {
        const parsed = JSON.parse(initialData.flowState);
        if (parsed.nodes && parsed.edges) {
          const restoredNodes = parsed.nodes as Node[];
          const restoredEdges = parsed.edges as Edge[];
          reSnapChildren(restoredNodes, restoredEdges);
          return [restoredNodes, restoredEdges];
        }
      } catch {}
    }

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

      if (nd.componentId === "broker") {
        let childConfigs: any[] = [];
        let groupConfigYaml = "";
        if (nd.configYaml?.trim()) {
          try {
            const parsed = yaml.load(nd.configYaml) as any;
            if (parsed && Array.isArray(parsed.inputs)) childConfigs = parsed.inputs;
            const { inputs: _inputs, ...rest } = parsed || {};
            if (Object.keys(rest).length > 0) {
              groupConfigYaml = yaml.dump(rest, { lineWidth: -1, noRefs: true });
            }
          } catch {}
        }

        const childCount = childConfigs.length;
        const groupHeight = calcBrokerInputGroupHeight(childCount);

        flowNodes.push({
          id,
          type: "brokerInputGroupNode",
          position: { x: xPos, y: NODE_Y - 25 },
          style: { width: GROUP_WIDTH, height: groupHeight },
          data: { ...nd, nodeId: id, isGroup: true, childCount, configYaml: groupConfigYaml },
        });

        childConfigs.forEach((inputObj, i) => {
          const componentName = Object.keys(inputObj).find((k) => k !== "label") || Object.keys(inputObj)[0];
          const config = inputObj[componentName];
          const childLabel = inputObj.label as string | undefined;
          const schema = allComponentSchemas.input.find(
            (o) => o.component === componentName || o.id === componentName
          );
          const childId = uuidv4();
          flowNodes.push({
            id: childId,
            type: "childInputNode",
            position: {
              x: CHILD_X,
              y: BROKER_INPUT_CHILD_Y_START + i * (CHILD_NODE_HEIGHT + CHILD_GAP_Y),
            },
            parentId: id,
            extent: "parent" as const,
            data: {
              label: childLabel || schema?.id || componentName,
              type: "input",
              componentId: schema?.id || componentName,
              component: componentName,
              configYaml: typeof config === "string" ? config : (config && Object.keys(config).length > 0 ? yaml.dump(config, { lineWidth: -1, noRefs: true }) : ""),
              nodeId: childId,
            },
          });
        });
      } else {
        flowNodes.push({
          id,
          type: "inputNode",
          position: { x: xPos, y: NODE_Y },
          data: { ...nd, nodeId: id },
        });
      }

      prevNodeId = id;
      xPos += NODE_SPACING_X;
    }

    for (const nd of processorNodes) {
      const id = uuidv4();

      if (nd.componentId === "catch") {
        // Parse catch children from configYaml
        let childConfigs: any[] = [];
        if (nd.configYaml?.trim()) {
          try {
            const parsed = yaml.load(nd.configYaml);
            if (Array.isArray(parsed)) childConfigs = parsed;
          } catch {}
        }

        const childCount = childConfigs.length;
        const groupHeight = calcCatchGroupHeight(childCount);

        flowNodes.push({
          id,
          type: "catchGroupNode",
          position: { x: xPos, y: NODE_Y - 25 },
          style: { width: GROUP_WIDTH, height: groupHeight },
          data: { ...nd, nodeId: id, isGroup: true, childCount, configYaml: "" },
        });

        let prevChildId: string | null = null;
        childConfigs.forEach((procObj, i) => {
          const componentName = Object.keys(procObj).find((k) => k !== "label") || Object.keys(procObj)[0];
          const config = procObj[componentName];
          const childLabel = procObj.label as string | undefined;
          const schema = allComponentSchemas.processor.find(
            (p) => p.component === componentName || p.id === componentName
          );
          const childId = uuidv4();
          flowNodes.push({
            id: childId,
            type: "childProcessorNode",
            position: {
              x: CHILD_X,
              y: CATCH_CHILD_Y_START + i * (CHILD_NODE_HEIGHT + CHILD_GAP_Y),
            },
            parentId: id,
            extent: "parent" as const,
            data: {
              label: childLabel || schema?.id || componentName,
              type: "processor",
              componentId: schema?.id || componentName,
              component: componentName,
              configYaml: typeof config === "string" ? config : (config && Object.keys(config).length > 0 ? yaml.dump(config, { lineWidth: -1, noRefs: true }) : ""),
              nodeId: childId,
            },
          });
          if (prevChildId) {
            flowEdges.push({
              id: `e-internal-${prevChildId}-${childId}`,
              source: prevChildId,
              target: childId,
              type: "pipeline",
              data: { internal: true },
            });
          }
          prevChildId = childId;
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
      } else {
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
    }

    for (const nd of outputNodes) {
      const id = uuidv4();

      if (nd.componentId === "broker") {
        // Parse broker config to extract children and pattern
        let brokerConfig: any = {};
        let childConfigs: any[] = [];
        let brokerPattern = "fan_out";
        if (nd.configYaml?.trim()) {
          try {
            brokerConfig = yaml.load(nd.configYaml) || {};
            if (Array.isArray(brokerConfig.outputs)) childConfigs = brokerConfig.outputs;
            if (brokerConfig.pattern) brokerPattern = brokerConfig.pattern;
          } catch {}
        }

        const childCount = childConfigs.length;
        const groupHeight = calcBrokerGroupHeight(childCount);

        // Build group configYaml without outputs (those are in children)
        const groupConfig: any = {};
        if (brokerConfig.copies) groupConfig.copies = brokerConfig.copies;
        if (brokerConfig.batching) groupConfig.batching = brokerConfig.batching;
        const groupConfigYaml = Object.keys(groupConfig).length > 0
          ? yaml.dump(groupConfig, { lineWidth: -1, noRefs: true })
          : "";

        flowNodes.push({
          id,
          type: "brokerGroupNode",
          position: { x: xPos, y: NODE_Y - 25 },
          style: { width: GROUP_WIDTH, height: groupHeight },
          data: { ...nd, nodeId: id, isGroup: true, childCount, configYaml: groupConfigYaml, brokerPattern },
        });

        let prevChildId: string | null = null;
        childConfigs.forEach((outputObj, i) => {
          const componentName = Object.keys(outputObj).find((k) => k !== "label") || Object.keys(outputObj)[0];
          const config = outputObj[componentName];
          const childLabel = outputObj.label as string | undefined;
          const schema = allComponentSchemas.output.find(
            (o) => o.component === componentName || o.id === componentName
          );
          const childId = uuidv4();
          flowNodes.push({
            id: childId,
            type: "childOutputNode",
            position: {
              x: CHILD_X,
              y: BROKER_CHILD_Y_START + i * (CHILD_NODE_HEIGHT + CHILD_GAP_Y),
            },
            parentId: id,
            extent: "parent" as const,
            data: {
              label: childLabel || schema?.id || componentName,
              type: "output",
              componentId: schema?.id || componentName,
              component: componentName,
              configYaml: typeof config === "string" ? config : (config && Object.keys(config).length > 0 ? yaml.dump(config, { lineWidth: -1, noRefs: true }) : ""),
              nodeId: childId,
              childIndex: i,
              parentBrokerPattern: brokerPattern,
            },
          });
          if (prevChildId && isBrokerSequential(brokerPattern)) {
            flowEdges.push({
              id: `e-internal-${prevChildId}-${childId}`,
              source: prevChildId,
              target: childId,
              type: "pipeline",
              data: makeInternalEdgeData(),
            });
          }
          prevChildId = childId;
        });

        if (prevNodeId) {
          flowEdges.push({
            id: `e-${prevNodeId}-${id}`,
            source: prevNodeId,
            target: id,
            type: "pipeline",
          });
        }
      } else {
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

      // Shift all top-level nodes to the right of insertX further right
      setNodes((nds) => [
        ...nds.map((n) =>
          !n.parentId && n.id !== sourceNodeId && n.position.x >= insertX
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
      setEditingNodeId(newId);
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

      // Shift target and all top-level nodes at or right of insertX further right
      setNodes((nds) => [
        ...nds.map((n) =>
          !n.parentId && n.position.x >= insertX
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
      setEditingNodeId(newId);
      scheduleAutoFit();
    },
    [nodes, setNodes, setEdges, scheduleAutoFit]
  );

  const handleAddChildProcessor = useCallback(
    (groupId: string) => {
      const groupNode = nodes.find((n) => n.id === groupId);
      if (!groupNode) return;

      const existingChildren = nodes.filter((n) => n.parentId === groupId);
      const childCount = existingChildren.length;
      const newId = uuidv4();
      const label = `catch_proc_${childCount + 1}`;

      const newChild: Node = {
        id: newId,
        type: "childProcessorNode",
        position: {
          x: CHILD_X,
          y: CATCH_CHILD_Y_START + childCount * (CHILD_NODE_HEIGHT + CHILD_GAP_Y),
        },
        parentId: groupId,
        extent: "parent" as const,
        data: {
          label,
          type: "processor",
          componentId: "",
          component: "",
          configYaml: "",
          nodeId: newId,
        } satisfies Partial<StreamFlowNodeData>,
      };

      const newHeight = calcCatchGroupHeight(childCount + 1);

      setNodes((nds) => [
        ...nds.map((n) =>
          n.id === groupId
            ? { ...n, style: { ...n.style, width: GROUP_WIDTH, height: newHeight }, data: { ...n.data, childCount: childCount + 1 } }
            : n
        ),
        newChild,
      ]);

      if (childCount > 0) {
        const lastChild = existingChildren.sort((a, b) => a.position.y - b.position.y)[childCount - 1];
        setEdges((eds) => [
          ...eds,
          {
            id: `e-internal-${lastChild.id}-${newId}`,
            source: lastChild.id,
            target: newId,
            type: "pipeline",
            data: { internal: true },
          },
        ]);
      }

      setSelectedNodeId(newId);
      setEditingNodeId(newId);
      scheduleAutoFit();
    },
    [nodes, setNodes, setEdges, scheduleAutoFit]
  );

  const handleAddChildOutput = useCallback(
    (groupId: string) => {
      const groupNode = nodes.find((n) => n.id === groupId);
      if (!groupNode) return;

      const existingChildren = nodes.filter((n) => n.parentId === groupId);
      const childCount = existingChildren.length;
      const newId = uuidv4();
      const label = `broker_output_${childCount + 1}`;

      const newChild: Node = {
        id: newId,
        type: "childOutputNode",
        position: {
          x: CHILD_X,
          y: BROKER_CHILD_Y_START + childCount * (CHILD_NODE_HEIGHT + CHILD_GAP_Y),
        },
        parentId: groupId,
        extent: "parent" as const,
        data: {
          label,
          type: "output",
          componentId: "",
          component: "",
          configYaml: "",
          nodeId: newId,
          childIndex: childCount,
          parentBrokerPattern: (groupNode.data as StreamFlowNodeData).brokerPattern || "fan_out",
        } satisfies Partial<StreamFlowNodeData>,
      };

      const newHeight = calcBrokerGroupHeight(childCount + 1);

      setNodes((nds) => [
        ...nds.map((n) =>
          n.id === groupId
            ? { ...n, style: { ...n.style, width: GROUP_WIDTH, height: newHeight }, data: { ...n.data, childCount: childCount + 1 } }
            : n
        ),
        newChild,
      ]);

      const pattern = (groupNode.data as StreamFlowNodeData).brokerPattern;
      if (childCount > 0 && isBrokerSequential(pattern)) {
        const lastChild = existingChildren.sort((a, b) => a.position.y - b.position.y)[childCount - 1];
        setEdges((eds) => [
          ...eds,
          {
            id: `e-internal-${lastChild.id}-${newId}`,
            source: lastChild.id,
            target: newId,
            type: "pipeline",
            data: makeInternalEdgeData(),
          },
        ]);
      }

      setSelectedNodeId(newId);
      setEditingNodeId(newId);
      scheduleAutoFit();
    },
    [nodes, setNodes, setEdges, scheduleAutoFit]
  );

  const handleAddChildInput = useCallback(
    (groupId: string) => {
      const groupNode = nodes.find((n) => n.id === groupId);
      if (!groupNode) return;

      const existingChildren = nodes.filter((n) => n.parentId === groupId);
      const childCount = existingChildren.length;
      const newId = uuidv4();
      const label = `broker_input_${childCount + 1}`;

      const newChild: Node = {
        id: newId,
        type: "childInputNode",
        position: {
          x: CHILD_X,
          y: BROKER_INPUT_CHILD_Y_START + childCount * (CHILD_NODE_HEIGHT + CHILD_GAP_Y),
        },
        parentId: groupId,
        extent: "parent" as const,
        data: {
          label,
          type: "input",
          componentId: "",
          component: "",
          configYaml: "",
          nodeId: newId,
        } satisfies Partial<StreamFlowNodeData>,
      };

      const newHeight = calcBrokerInputGroupHeight(childCount + 1);

      setNodes((nds) => [
        ...nds.map((n) =>
          n.id === groupId
            ? { ...n, style: { ...n.style, width: GROUP_WIDTH, height: newHeight }, data: { ...n.data, childCount: childCount + 1 } }
            : n
        ),
        newChild,
      ]);

      setSelectedNodeId(newId);
      setEditingNodeId(newId);
      scheduleAutoFit();
    },
    [nodes, setNodes, scheduleAutoFit]
  );

  const handleChildDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      if (!node.parentId) return;
      const groupId = node.parentId;
      const groupNode = nodes.find((n) => n.id === groupId);
      if (!groupNode) return;
      const isBrokerOutput = groupNode.type === "brokerGroupNode";
      const isBrokerInput = groupNode.type === "brokerInputGroupNode";
      const isBroker = isBrokerOutput || isBrokerInput;
      const childYStart = isBrokerOutput ? BROKER_CHILD_Y_START : isBrokerInput ? BROKER_INPUT_CHILD_Y_START : CATCH_CHILD_Y_START;

      const siblings = nodes
        .filter((n) => n.parentId === groupId)
        .sort((a, b) => a.position.y - b.position.y);

      // Snap all children to grid positions based on current y-order
      setNodes((nds) => {
        const sorted = nds
          .filter((n) => n.parentId === groupId)
          .sort((a, b) => a.position.y - b.position.y);
        return nds.map((n) => {
          const idx = sorted.findIndex((s) => s.id === n.id);
          if (idx >= 0) {
            return {
              ...n,
              position: { x: CHILD_X, y: childYStart + idx * (CHILD_NODE_HEIGHT + CHILD_GAP_Y) },
              ...(isBrokerOutput ? { data: { ...n.data, childIndex: idx } } : {}),
            };
          }
          return n;
        });
      });

      if (siblings.length <= 1) return;

      // Broker input: never chain. Broker output: only if sequential. Catch: always chain.
      const brokerPattern = isBrokerOutput ? (groupNode.data as StreamFlowNodeData).brokerPattern : undefined;
      const shouldChain = isBrokerInput ? false : isBrokerOutput ? isBrokerSequential(brokerPattern) : true;

      // Rebuild internal edges in new order
      const childIds = new Set(siblings.map((s) => s.id));
      setEdges((eds) => {
        const kept = eds.filter(
          (e) => !((e.data as any)?.internal && (childIds.has(e.source) || childIds.has(e.target)))
        );
        if (!shouldChain) return kept;
        const sorted = [...siblings];
        sorted.sort((a, b) => {
          const na = nodes.find((n) => n.id === a.id);
          const nb = nodes.find((n) => n.id === b.id);
          return (na?.position.y ?? 0) - (nb?.position.y ?? 0);
        });
        const edgeData = isBroker ? makeInternalEdgeData() : { internal: true };
        const newEdges: Edge[] = [];
        for (let i = 0; i < sorted.length - 1; i++) {
          newEdges.push({
            id: `e-internal-${sorted[i].id}-${sorted[i + 1].id}`,
            source: sorted[i].id,
            target: sorted[i + 1].id,
            type: "pipeline",
            data: edgeData,
          });
        }
        return [...kept, ...newEdges];
      });
    },
    [nodes, setNodes, setEdges]
  );

  // Inject callbacks into node data and compute child extent dynamically
  const nodesWithCallbacks = useMemo(() => {
    return nodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        nodeId: n.id,
        onAddAndConnect: handleAddAndConnect,
        onAddBefore: handleAddBefore,
        onAddChildProcessor: handleAddChildProcessor,
        onAddChildOutput: handleAddChildOutput,
        onAddChildInput: handleAddChildInput,
      },
    }));
  }, [nodes, handleAddAndConnect, handleAddBefore, handleAddChildProcessor, handleAddChildOutput, handleAddChildInput]);

  const edgesWithCallbacks = useMemo(() => {
    return edges.map((e) => ({
      ...e,
      data: {
        ...e.data,
        ...(!(e.data as any)?.internal ? { onDeleteEdge: handleDeleteEdge } : {}),
      },
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

      // Prevent connections to/from child nodes
      if (source.parentId || target.parentId) return false;

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
      const existingOfType = nodes.filter((n) => (n.data as StreamFlowNodeData).type === type && !n.parentId);
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
      setEditingNodeId(newId);
      scheduleAutoFit();
    },
    [nodes, setNodes, addToast, scheduleAutoFit]
  );

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setContextMenu(null);
  }, []);

  const handleNodeDoubleClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setEditingNodeId(node.id);
  }, []);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault();
    setSelectedNodeId(node.id);
    setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setContextMenu(null);
  }, []);

  const editingNode = useMemo(() => {
    const n = nodes.find((n) => n.id === editingNodeId);
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
      isGroup: d.isGroup === true,
      isGroupChild: !!n.parentId,
    };
  }, [nodes, editingNodeId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (editingNodeId || tryDialogOpen || deleteConfirmNodeId) return;
      if (!selectedNodeId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if (e.key === "e" || e.key === "E") {
        e.preventDefault();
        setEditingNodeId(selectedNodeId);
      } else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        setDeleteConfirmNodeId(selectedNodeId);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedNodeId, editingNodeId, tryDialogOpen, deleteConfirmNodeId]);

  useEffect(() => {
    if (!contextMenu) return;
    const close = (e: Event) => {
      // Don't close if clicking inside the context menu itself
      const target = e.target as HTMLElement;
      if (target.closest("[data-context-menu]")) return;
      setContextMenu(null);
    };
    // Use setTimeout to avoid the current event from immediately closing the menu
    const timeoutId = setTimeout(() => {
      window.addEventListener("click", close);
      window.addEventListener("contextmenu", close);
    }, 0);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [contextMenu]);

  const childFilteredSchemas = useMemo(() => {
    if (!editingNode?.isGroupChild) return allComponentSchemas;
    const parentNode = nodes.find((n) => n.id === nodes.find((cn) => cn.id === editingNode.id)?.parentId);
    const isBrokerChild = parentNode && (parentNode.data as StreamFlowNodeData).componentId === "broker";
    if (isBrokerChild) {
      const parentType = (parentNode.data as StreamFlowNodeData).type;
      if (parentType === "input") {
        return {
          ...allComponentSchemas,
          input: allComponentSchemas.input.filter((o) => o.id !== "broker"),
        };
      }
      return {
        ...allComponentSchemas,
        output: allComponentSchemas.output.filter((o) => o.id !== "broker"),
      };
    }
    return {
      ...allComponentSchemas,
      processor: allComponentSchemas.processor.filter((p) => p.id !== "catch"),
    };
  }, [allComponentSchemas, editingNode?.isGroupChild, editingNode?.id, nodes]);

  const isMcpServer = useMemo(
    () => nodes.some((n) => (n.data as StreamFlowNodeData).type === "input" && (n.data as StreamFlowNodeData).componentId === "mcp_tool"),
    [nodes]
  );

  const handleUpdateNode = useCallback(
    (nodeId: string, data: StreamNodeData) => {
      setNodes((nds) => {
        const currentNode = nds.find((n) => n.id === nodeId);
        const prevComponentId = currentNode ? (currentNode.data as StreamFlowNodeData).componentId : undefined;

        // Clear disconnected state on all nodes when any config changes
        let updated = nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, ...data, nodeId: n.id, disconnected: false } }
            : (n.data as StreamFlowNodeData).disconnected
              ? { ...n, data: { ...n.data, disconnected: false } }
              : n
        );

        // Transform to catch group when component changes to "catch"
        if (data.componentId === "catch" && prevComponentId !== "catch" && data.type === "processor") {
          updated = updated.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  type: "catchGroupNode",
                  style: { width: GROUP_WIDTH, height: CATCH_GROUP_MIN_HEIGHT },
                  position: { ...n.position, y: n.position.y - 25 },
                  data: { ...n.data, isGroup: true, childCount: 0, configYaml: "" },
                }
              : n
          );
        }

        // Transform back from catch group when component changes away from "catch"
        if (prevComponentId === "catch" && data.componentId !== "catch" && data.type === "processor") {
          const childIds = updated.filter((n) => n.parentId === nodeId).map((n) => n.id);
          updated = updated.filter((n) => n.parentId !== nodeId);
          setEdges((eds) => eds.filter((e) => !childIds.includes(e.source) && !childIds.includes(e.target)));
          updated = updated.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  type: "processorNode",
                  style: undefined,
                  position: { ...n.position, y: n.position.y + 25 },
                  data: { ...n.data, isGroup: false, childCount: undefined },
                }
              : n
          );
        }

        // Transform to broker group when output component changes to "broker"
        if (data.componentId === "broker" && prevComponentId !== "broker" && data.type === "output") {
          updated = updated.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  type: "brokerGroupNode",
                  style: { width: GROUP_WIDTH, height: BROKER_GROUP_MIN_HEIGHT },
                  position: { ...n.position, y: n.position.y - 25 },
                  data: { ...n.data, isGroup: true, childCount: 0, configYaml: "", brokerPattern: "fan_out" },
                }
              : n
          );
        }

        // Transform back from broker group when component changes away from "broker"
        if (prevComponentId === "broker" && data.componentId !== "broker" && data.type === "output") {
          const childIds = updated.filter((n) => n.parentId === nodeId).map((n) => n.id);
          updated = updated.filter((n) => n.parentId !== nodeId);
          setEdges((eds) => eds.filter((e) => !childIds.includes(e.source) && !childIds.includes(e.target)));
          updated = updated.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  type: "outputNode",
                  style: undefined,
                  position: { ...n.position, y: n.position.y + 25 },
                  data: { ...n.data, isGroup: false, childCount: undefined, brokerPattern: undefined },
                }
              : n
          );
        }

        // Transform to broker input group when input component changes to "broker"
        if (data.componentId === "broker" && prevComponentId !== "broker" && data.type === "input") {
          updated = updated.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  type: "brokerInputGroupNode",
                  style: { width: GROUP_WIDTH, height: BROKER_INPUT_GROUP_MIN_HEIGHT },
                  position: { ...n.position, y: n.position.y - 25 },
                  data: { ...n.data, isGroup: true, childCount: 0, configYaml: "" },
                }
              : n
          );
        }

        // Transform back from broker input group when component changes away from "broker"
        if (prevComponentId === "broker" && data.componentId !== "broker" && data.type === "input") {
          const childIds = updated.filter((n) => n.parentId === nodeId).map((n) => n.id);
          updated = updated.filter((n) => n.parentId !== nodeId);
          setEdges((eds) => eds.filter((e) => !childIds.includes(e.source) && !childIds.includes(e.target)));
          updated = updated.map((n) =>
            n.id === nodeId
              ? {
                  ...n,
                  type: "inputNode",
                  style: undefined,
                  position: { ...n.position, y: n.position.y + 25 },
                  data: { ...n.data, isGroup: false, childCount: undefined },
                }
              : n
          );
        }

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
      const nodeToDelete = nodes.find((n) => n.id === nodeId);
      if (!nodeToDelete) return;

      if (nodeToDelete.parentId) {
        // Deleting a child inside a group
        const groupId = nodeToDelete.parentId;
        const groupNode = nodes.find((n) => n.id === groupId);
        const isBrokerOutput = groupNode?.type === "brokerGroupNode";
        const isBrokerInput = groupNode?.type === "brokerInputGroupNode";
        const childYStart = isBrokerOutput ? BROKER_CHILD_Y_START : isBrokerInput ? BROKER_INPUT_CHILD_Y_START : CATCH_CHILD_Y_START;
        const calcHeight = isBrokerOutput ? calcBrokerGroupHeight : isBrokerInput ? calcBrokerInputGroupHeight : calcCatchGroupHeight;

        // Remove old internal edges touching this node, rebuild chain for remaining siblings
        const brokerPattern = isBrokerOutput ? (groupNode?.data as StreamFlowNodeData)?.brokerPattern : undefined;
        const shouldChain = isBrokerInput ? false : isBrokerOutput ? isBrokerSequential(brokerPattern) : true;
        setEdges((eds) => {
          const cleaned = eds.filter((e) => e.source !== nodeId && e.target !== nodeId);
          const remainingSiblings = nodes
            .filter((n) => n.parentId === groupId && n.id !== nodeId)
            .sort((a, b) => a.position.y - b.position.y);
          const sibIds = new Set(remainingSiblings.map((s) => s.id));
          const kept = cleaned.filter(
            (e) => !((e.data as any)?.internal && (sibIds.has(e.source) || sibIds.has(e.target)))
          );
          if (!shouldChain) return kept;
          const edgeData = { internal: true };
          const newEdges: Edge[] = [];
          for (let i = 0; i < remainingSiblings.length - 1; i++) {
            newEdges.push({
              id: `e-internal-${remainingSiblings[i].id}-${remainingSiblings[i + 1].id}`,
              source: remainingSiblings[i].id,
              target: remainingSiblings[i + 1].id,
              type: "pipeline",
              data: edgeData,
            });
          }
          return [...kept, ...newEdges];
        });

        setNodes((nds) => {
          const remaining = nds.filter((n) => n.id !== nodeId);
          const siblings = remaining.filter((n) => n.parentId === groupId).sort((a, b) => a.position.y - b.position.y);
          const newHeight = calcHeight(siblings.length);

          return remaining.map((n) => {
            if (n.id === groupId) {
              return { ...n, style: { ...n.style, width: GROUP_WIDTH, height: newHeight }, data: { ...n.data, childCount: siblings.length } };
            }
            const sibIdx = siblings.findIndex((s) => s.id === n.id);
            if (sibIdx >= 0) {
              return { ...n, position: { x: CHILD_X, y: childYStart + sibIdx * (CHILD_NODE_HEIGHT + CHILD_GAP_Y) } };
            }
            return n;
          });
        });
      } else {
        // Deleting a top-level node — also delete children if it's a group
        const childIds = nodes.filter((n) => n.parentId === nodeId).map((n) => n.id);
        const allIds = [nodeId, ...childIds];
        setNodes((nds) => nds.filter((n) => !allIds.includes(n.id)));
        setEdges((eds) => eds.filter((e) => !allIds.includes(e.source) && !allIds.includes(e.target)));
      }

      if (selectedNodeId === nodeId) setSelectedNodeId(null);
      if (editingNodeId === nodeId) setEditingNodeId(null);
    },
    [nodes, edges, setNodes, setEdges, selectedNodeId, editingNodeId]
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
    // Only check top-level nodes (not children inside groups)
    const topLevelNodes = nodes.filter((n) => !n.parentId);
    if (topLevelNodes.length === 0) return new Set();

    const adj = new Map<string, string[]>();
    const radj = new Map<string, string[]>();
    for (const n of topLevelNodes) {
      adj.set(n.id, []);
      radj.set(n.id, []);
    }
    const externalEdges = edges.filter((e) => !(e.data as any)?.internal);
    for (const e of externalEdges) {
      adj.get(e.source)?.push(e.target);
      radj.get(e.target)?.push(e.source);
    }

    const inputNode = topLevelNodes.find((n) => (n.data as StreamFlowNodeData).type === "input");
    const outputNode = topLevelNodes.find((n) => (n.data as StreamFlowNodeData).type === "output");

    if (!inputNode || !outputNode) return new Set(topLevelNodes.map((n) => n.id));

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
    for (const n of topLevelNodes) {
      if (!forwardReachable.has(n.id) || !backwardReachable.has(n.id)) {
        disconnected.add(n.id);
      }
    }

    return disconnected;
  }, [nodes, edges]);

  const serializeCatchGroup = useCallback(
    (groupNode: Node): StreamNodeData => {
      const d = groupNode.data as StreamFlowNodeData;
      const children = nodes.filter((cn) => cn.parentId === groupNode.id).sort((a, b) => a.position.y - b.position.y);
      const childConfigs = children.map((child) => {
        const cd = child.data as StreamFlowNodeData;
        const comp = allComponentSchemas.processor.find((c) => c.id === cd.componentId);
        const componentName = comp?.component || cd.componentId || "";
        const entry: any = {};
        if (comp?.schema?.flat) {
          entry[componentName] = cd.configYaml?.trim() || "";
        } else {
          let config: any = {};
          if (cd.configYaml?.trim()) { try { config = yaml.load(cd.configYaml) || {}; } catch {} }
          entry[componentName] = config;
        }
        if (cd.label) {
          entry.label = cd.label;
        }
        return entry;
      });
      const catchYaml = childConfigs.length > 0
        ? yaml.dump(childConfigs, { lineWidth: -1, noRefs: true, quotingType: '"', forceQuotes: false })
        : "";
      return { label: d.label, type: "processor", componentId: "catch", component: "catch", configYaml: catchYaml };
    },
    [nodes, allComponentSchemas]
  );

  const serializeBrokerGroup = useCallback(
    (groupNode: Node): StreamNodeData => {
      const d = groupNode.data as StreamFlowNodeData;
      const children = nodes.filter((cn) => cn.parentId === groupNode.id).sort((a, b) => a.position.y - b.position.y);

      // Build outputs array from children
      const outputsList = children.map((child) => {
        const cd = child.data as StreamFlowNodeData;
        const comp = allComponentSchemas.output.find((c) => c.id === cd.componentId);
        const componentName = comp?.component || cd.componentId || "";
        const entry: any = {};
        if (comp?.schema?.flat) {
          entry[componentName] = cd.configYaml?.trim() || "";
        } else {
          let config: any = {};
          if (cd.configYaml?.trim()) { try { config = yaml.load(cd.configYaml) || {}; } catch {} }
          entry[componentName] = config;
        }
        if (cd.label) {
          entry.label = cd.label;
        }
        return entry;
      });

      // Build broker config with pattern + outputs
      const brokerConfig: any = {};
      if (d.brokerPattern) brokerConfig.pattern = d.brokerPattern;

      // Parse any extra config from group's configYaml (copies, batching)
      if (d.configYaml?.trim()) {
        try {
          const extra = yaml.load(d.configYaml) as any;
          if (extra && typeof extra === "object") {
            Object.assign(brokerConfig, extra);
          }
        } catch {}
      }

      brokerConfig.outputs = outputsList;

      const brokerYaml = yaml.dump(brokerConfig, { lineWidth: -1, noRefs: true, quotingType: '"', forceQuotes: false });
      return { label: d.label, type: "output", componentId: "broker", component: "broker", configYaml: brokerYaml };
    },
    [nodes, allComponentSchemas]
  );

  const serializeBrokerInputGroup = useCallback(
    (groupNode: Node): StreamNodeData => {
      const d = groupNode.data as StreamFlowNodeData;
      const children = nodes.filter((cn) => cn.parentId === groupNode.id).sort((a, b) => a.position.y - b.position.y);

      const inputsList = children.map((child) => {
        const cd = child.data as StreamFlowNodeData;
        const comp = allComponentSchemas.input.find((c) => c.id === cd.componentId);
        const componentName = comp?.component || cd.componentId || "";
        const entry: any = {};
        if (comp?.schema?.flat) {
          entry[componentName] = cd.configYaml?.trim() || "";
        } else {
          let config: any = {};
          if (cd.configYaml?.trim()) { try { config = yaml.load(cd.configYaml) || {}; } catch {} }
          entry[componentName] = config;
        }
        if (cd.label) {
          entry.label = cd.label;
        }
        return entry;
      });

      const brokerConfig: any = {};

      if (d.configYaml?.trim()) {
        try {
          const extra = yaml.load(d.configYaml) as any;
          if (extra && typeof extra === "object") {
            Object.assign(brokerConfig, extra);
          }
        } catch {}
      }

      brokerConfig.inputs = inputsList;

      const brokerYaml = yaml.dump(brokerConfig, { lineWidth: -1, noRefs: true, quotingType: '"', forceQuotes: false });
      return { label: d.label, type: "input", componentId: "broker", component: "broker", configYaml: brokerYaml };
    },
    [nodes, allComponentSchemas]
  );

  const handleValidate = useCallback(async () => {
    if (!onValidate) return;

    const inputNode = nodes.find((n) => (n.data as StreamFlowNodeData).type === "input");
    const outputNode = nodes.find((n) => (n.data as StreamFlowNodeData).type === "output");

    if (!inputNode || !outputNode) {
      addToast({ id: "validate-err", title: "Invalid", description: "Stream must have both an input and output node.", variant: "error", duration: 5000 });
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
      addToast({ id: "validate-err", title: "Invalid", description: `${disconnected.size} node(s) are not connected to the pipeline.`, variant: "error", duration: 5000 });
      return;
    }

    setIsValidating(true);
    try {
      const nodeDataList = nodes
        .filter((n) => !n.parentId)
        .map((n) => {
          const d = n.data as StreamFlowNodeData;
          if (d.isGroup && d.componentId === "catch") return serializeCatchGroup(n);
          if (d.isGroup && d.componentId === "broker" && d.type === "output") return serializeBrokerGroup(n);
          if (d.isGroup && d.componentId === "broker" && d.type === "input") return serializeBrokerInputGroup(n);
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
  }, [onValidate, name, status, bufferId, nodes, addToast, serializeCatchGroup, serializeBrokerGroup, serializeBrokerInputGroup, findDisconnectedNodes, setNodes]);

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
      const topProcessors = nodes.filter((n) => (n.data as StreamFlowNodeData).type === "processor" && !n.parentId);
      const processors = topProcessors.map((n) => {
        const d = n.data as StreamFlowNodeData;
        if (d.isGroup && d.componentId === "catch") {
          const serialized = serializeCatchGroup(n);
          return { label: serialized.label, component: "catch", config: serialized.configYaml || "" };
        }
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
  }, [onTry, tryMessages, nodes, allComponentSchemas, addToast, serializeCatchGroup]);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      addToast({ id: "name-req", title: "Validation Error", description: "Stream name is required.", variant: "warning" });
      return;
    }

    const inputNode = nodes.find((n) => (n.data as StreamFlowNodeData).type === "input");
    const outputNode = nodes.find((n) => (n.data as StreamFlowNodeData).type === "output");

    // Serialize flow state for persistence
    const flowState = JSON.stringify({ nodes, edges });

    // Determine if stream is ready (fully connected and configured)
    let isReady = true;

    if (!inputNode || !outputNode) {
      isReady = false;
    }

    const disconnected = findDisconnectedNodes();
    if (disconnected.size > 0) {
      isReady = false;
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
        description: `${disconnected.size} node(s) are not connected. Stream will be saved as not ready.`,
        variant: "warning",
        duration: 5000,
      });
    }

    // Validate top-level nodes (skip children — they're validated via their group)
    for (const n of nodes) {
      if (n.parentId) continue;
      const d = n.data as StreamFlowNodeData;
      if (d.isGroup) {
        const groupType = d.componentId === "broker" ? (d.type === "input" ? "Broker Input" : "Broker Output") : "Catch Processor";
        const children = nodes.filter((cn) => cn.parentId === n.id);
        for (const child of children) {
          const cd = child.data as StreamFlowNodeData;
          const childData: StreamNodeData = { label: cd.label, type: cd.type, componentId: cd.componentId, component: cd.component, configYaml: cd.configYaml };
          const validation = validateRequiredFields(childData);
          if (!validation.isValid) {
            isReady = false;
            const errorMessage = validation.error || `Missing required fields: ${validation.missingFields.join(", ")}`;
            addToast({
              id: `validation-${child.id}`,
              title: `${groupType} Validation Error`,
              description: `"${cd.label}" in ${d.componentId} "${d.label}" - ${errorMessage}`,
              variant: "warning",
            });
          }
        }
        continue;
      }
      const nodeData: StreamNodeData = { label: d.label, type: d.type, componentId: d.componentId, component: d.component, configYaml: d.configYaml };
      const validation = validateRequiredFields(nodeData);
      if (!validation.isValid) {
        isReady = false;
        const errorMessage = validation.error || `Missing required fields: ${validation.missingFields.join(", ")}`;
        addToast({
          id: `validation-${n.id}`,
          title: `${d.type.charAt(0).toUpperCase() + d.type.slice(1)} Validation Error`,
          description: `"${d.label}" - ${errorMessage}`,
          variant: "warning",
        });
      }
    }

    // Build ordered node data: input, processors in edge-order, output
    const orderedNodes: StreamNodeData[] = [];

    if (inputNode) {
      const inputD = inputNode.data as StreamFlowNodeData;
      if (inputD.isGroup && inputD.componentId === "broker") {
        orderedNodes.push(serializeBrokerInputGroup(inputNode));
      } else {
        orderedNodes.push({ label: inputD.label, type: inputD.type, componentId: inputD.componentId, component: inputD.component, configYaml: inputD.configYaml });
      }
    }

    if (inputNode && outputNode) {
      // Walk edges from input to output (external edges only)
      const adj = new Map<string, string>();
      for (const e of edges) {
        if ((e.data as any)?.internal) continue;
        adj.set(e.source, e.target);
      }
      let current = adj.get(inputNode.id);
      while (current && current !== outputNode.id) {
        const node = nodes.find((n) => n.id === current);
        if (node) {
          const d = node.data as StreamFlowNodeData;
          if (d.isGroup && d.componentId === "catch") {
            orderedNodes.push(serializeCatchGroup(node));
          } else {
            orderedNodes.push({ label: d.label, type: d.type, componentId: d.componentId, component: d.component, configYaml: d.configYaml });
          }
        }
        current = adj.get(current!);
      }
    }

    if (outputNode) {
      const outputD = outputNode.data as StreamFlowNodeData;
      if (outputD.isGroup && outputD.componentId === "broker") {
        orderedNodes.push(serializeBrokerGroup(outputNode));
      } else {
        orderedNodes.push({ label: outputD.label, type: outputD.type, componentId: outputD.componentId, component: outputD.component, configYaml: outputD.configYaml });
      }
    }

    onSave({ name, status, bufferId, nodes: orderedNodes, flowState, isReady });
  }, [name, status, bufferId, nodes, edges, onSave, addToast, findDisconnectedNodes, validateRequiredFields, setNodes, serializeCatchGroup, serializeBrokerGroup, serializeBrokerInputGroup]);

  const hasInput = nodes.some((n) => (n.data as StreamFlowNodeData).type === "input");
  const hasOutput = nodes.some((n) => (n.data as StreamFlowNodeData).type === "output");
  const hasProcessors = nodes.some((n) => (n.data as StreamFlowNodeData).type === "processor" && !n.parentId);

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
          onNodeDragStop={handleChildDragStop}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onNodeContextMenu={handleNodeContextMenu}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          isValidConnection={isValidConnection}
          fitView
          colorMode={colorMode}
          deleteKeyCode={null}
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

      {/* Config modal */}
      <Dialog open={!!editingNodeId} onOpenChange={(open: boolean) => { if (!open) setEditingNodeId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {editingNode?.isGroup
                ? editingNode.data.componentId === "broker"
                  ? editingNode.data.type === "input" ? "Broker Input Configuration" : "Broker Output Configuration"
                  : "Catch Group Configuration"
                : `Configure ${editingNode?.data.type ? editingNode.data.type.charAt(0).toUpperCase() + editingNode.data.type.slice(1) : ""} Node`}
            </DialogTitle>
            <DialogDescription>
              Changes are applied automatically. Close this dialog and use the Save button to persist.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {editingNode?.isGroup ? (
              <div className="space-y-4 p-1">
                <div className="space-y-2">
                  <Label htmlFor="group-label">Label</Label>
                  <Input
                    id="group-label"
                    value={editingNode.data.label}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[a-z0-9_-]*$/.test(val)) {
                        handleUpdateNode(editingNode.id, { ...editingNode.data, label: val });
                      }
                    }}
                    placeholder={editingNode.data.componentId === "broker" ? "broker label" : "catch label"}
                  />
                </div>
                {editingNode.data.componentId === "broker" && editingNode.data.type === "output" && (() => {
                  const currentPattern = (nodes.find((n) => n.id === editingNode.id)?.data as StreamFlowNodeData)?.brokerPattern || "fan_out";
                  const patternDescriptions: Record<string, string> = {
                    fan_out: "Sends each message to all outputs in parallel. If an output applies back-pressure, it blocks other outputs from receiving new messages until it catches up.",
                    fan_out_fail_fast: "Sends each message to all outputs in parallel. Unlike fan_out, a failing output does not block other outputs and the message is abandoned immediately.",
                    fan_out_sequential: "Sends each message to all outputs one by one in the order they are listed. Each output must acknowledge the message before it is sent to the next.",
                    fan_out_sequential_fail_fast: "Sends each message to all outputs one by one in order. Unlike fan_out_sequential, a failing output causes the message to be abandoned immediately.",
                    round_robin: "Distributes messages across outputs by alternating between them in a round-robin fashion. Each message goes to exactly one output.",
                    greedy: "Sends each message to the first available output that is ready to accept it. Useful when outputs have varying throughput.",
                  };
                  const groupNode = nodes.find((n) => n.id === editingNode.id);
                  const groupData = groupNode?.data as StreamFlowNodeData | undefined;
                  let batchingConfig: any = {};
                  if (groupData?.configYaml?.trim()) {
                    try {
                      const parsed = yaml.load(groupData.configYaml) as any;
                      if (parsed?.batching) batchingConfig = parsed.batching;
                    } catch {}
                  }
                  const updateBatching = (field: string, value: any) => {
                    setNodes((nds) => nds.map((n) => {
                      if (n.id !== editingNode.id) return n;
                      let existing: any = {};
                      if ((n.data as StreamFlowNodeData).configYaml?.trim()) {
                        try { existing = yaml.load((n.data as StreamFlowNodeData).configYaml!) as any || {}; } catch {}
                      }
                      const batching = { ...(existing.batching || {}), [field]: value };
                      // Remove empty/default values
                      if (batching[field] === 0 || batching[field] === "" || batching[field] === undefined) delete batching[field];
                      const newConfig = { ...existing, batching: Object.keys(batching).length > 0 ? batching : undefined };
                      if (!newConfig.batching) delete newConfig.batching;
                      const configYaml = Object.keys(newConfig).length > 0
                        ? yaml.dump(newConfig, { lineWidth: -1, noRefs: true })
                        : "";
                      return { ...n, data: { ...n.data, configYaml } };
                    }));
                  };
                  return (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="broker-pattern">Pattern</Label>
                        <Select
                          value={currentPattern}
                          onValueChange={(val) => {
                            setNodes((nds) => nds.map((n) =>
                              n.id === editingNode.id
                                ? { ...n, data: { ...n.data, brokerPattern: val } }
                                : n.parentId === editingNode.id
                                  ? { ...n, data: { ...n.data, parentBrokerPattern: val } }
                                  : n
                            ));
                            // Add or remove internal edges based on pattern
                            const children = nodes
                              .filter((n) => n.parentId === editingNode.id)
                              .sort((a, b) => a.position.y - b.position.y);
                            const childIds = new Set(children.map((c) => c.id));
                            setEdges((eds) => {
                              const kept = eds.filter(
                                (e) => !((e.data as any)?.internal && (childIds.has(e.source) || childIds.has(e.target)))
                              );
                              if (!isBrokerSequential(val) || children.length <= 1) return kept;
                              const newEdges: Edge[] = [];
                              for (let i = 0; i < children.length - 1; i++) {
                                newEdges.push({
                                  id: `e-internal-${children[i].id}-${children[i + 1].id}`,
                                  source: children[i].id,
                                  target: children[i + 1].id,
                                  type: "pipeline",
                                  data: makeInternalEdgeData(),
                                });
                              }
                              return [...kept, ...newEdges];
                            });
                          }}
                        >
                          <SelectTrigger id="broker-pattern">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fan_out">fan_out</SelectItem>
                            <SelectItem value="fan_out_fail_fast">fan_out_fail_fast</SelectItem>
                            <SelectItem value="fan_out_sequential">fan_out_sequential</SelectItem>
                            <SelectItem value="fan_out_sequential_fail_fast">fan_out_sequential_fail_fast</SelectItem>
                            <SelectItem value="round_robin">round_robin</SelectItem>
                            <SelectItem value="greedy">greedy</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">{patternDescriptions[currentPattern]}</p>
                      </div>
                      <div className="space-y-3 border rounded-md p-3">
                        <p className="text-sm font-medium">Batching</p>
                        <p className="text-xs text-muted-foreground">Configure how messages are batched before being sent to outputs.</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="batch-count" className="text-xs">Count</Label>
                            <Input
                              id="batch-count"
                              type="number"
                              min={0}
                              placeholder="0"
                              value={batchingConfig.count || ""}
                              onChange={(e) => updateBatching("count", e.target.value ? parseInt(e.target.value) : 0)}
                            />
                            <p className="text-[10px] text-muted-foreground">Flush after this many messages. 0 to disable.</p>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="batch-byte-size" className="text-xs">Byte Size</Label>
                            <Input
                              id="batch-byte-size"
                              type="number"
                              min={0}
                              placeholder="0"
                              value={batchingConfig.byte_size || ""}
                              onChange={(e) => updateBatching("byte_size", e.target.value ? parseInt(e.target.value) : 0)}
                            />
                            <p className="text-[10px] text-muted-foreground">Flush after this many bytes. 0 to disable.</p>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="batch-period" className="text-xs">Period</Label>
                            <Input
                              id="batch-period"
                              placeholder="e.g. 500ms, 1s"
                              value={batchingConfig.period || ""}
                              onChange={(e) => updateBatching("period", e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground">Flush after this time regardless of size.</p>
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="batch-jitter" className="text-xs">Jitter</Label>
                            <Input
                              id="batch-jitter"
                              type="number"
                              min={0}
                              step={0.1}
                              placeholder="0"
                              value={batchingConfig.jitter || ""}
                              onChange={(e) => updateBatching("jitter", e.target.value ? parseFloat(e.target.value) : 0)}
                            />
                            <p className="text-[10px] text-muted-foreground">Random delay factor for flush intervals.</p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="batch-check" className="text-xs">Check</Label>
                          <Input
                            id="batch-check"
                            placeholder="Bloblang query"
                            value={batchingConfig.check || ""}
                            onChange={(e) => updateBatching("check", e.target.value)}
                          />
                          <p className="text-[10px] text-muted-foreground">A Bloblang query returning a boolean to decide if a message should end the batch.</p>
                        </div>
                      </div>
                    </>
                  );
                })()}
                {editingNode.data.componentId === "broker" && editingNode.data.type === "input" && (() => {
                  let currentConfig: any = {};
                  const configYaml = (nodes.find((n) => n.id === editingNode.id)?.data as StreamFlowNodeData)?.configYaml;
                  if (configYaml?.trim()) { try { currentConfig = yaml.load(configYaml) || {}; } catch {} }

                  const updateInputBrokerConfig = (field: string, value: any) => {
                    setNodes((nds) => nds.map((n) => {
                      if (n.id !== editingNode.id) return n;
                      const d = n.data as StreamFlowNodeData;
                      let config: any = {};
                      if (d.configYaml?.trim()) { try { config = yaml.load(d.configYaml) || {}; } catch {} }
                      if (field.startsWith("batching.")) {
                        const batchField = field.split(".")[1];
                        if (!config.batching) config.batching = {};
                        if (value === "" || value === 0) { delete config.batching[batchField]; }
                        else { config.batching[batchField] = value; }
                        if (Object.keys(config.batching).length === 0) delete config.batching;
                      } else {
                        if (value === "" || value === 0 || value === 1) { delete config[field]; }
                        else { config[field] = value; }
                      }
                      const newYaml = Object.keys(config).length > 0 ? yaml.dump(config, { lineWidth: -1, noRefs: true }) : "";
                      return { ...n, data: { ...n.data, configYaml: newYaml } };
                    }));
                  };

                  const batchingConfig = currentConfig.batching || {};

                  return (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="input-broker-copies" className="text-xs">Copies</Label>
                        <Input
                          id="input-broker-copies"
                          type="number"
                          min={1}
                          placeholder="1"
                          value={currentConfig.copies || ""}
                          onChange={(e) => updateInputBrokerConfig("copies", e.target.value ? parseInt(e.target.value) : 1)}
                        />
                        <p className="text-[10px] text-muted-foreground">Number of copies of each configured input to spawn.</p>
                      </div>
                      <div className="space-y-2 border rounded-md p-3">
                        <span className="text-xs font-medium">Batching</span>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="ib-batch-count" className="text-xs">Count</Label>
                            <Input id="ib-batch-count" type="number" min={0} placeholder="0" value={batchingConfig.count || ""} onChange={(e) => updateInputBrokerConfig("batching.count", e.target.value ? parseInt(e.target.value) : 0)} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="ib-batch-byte-size" className="text-xs">Byte Size</Label>
                            <Input id="ib-batch-byte-size" type="number" min={0} placeholder="0" value={batchingConfig.byte_size || ""} onChange={(e) => updateInputBrokerConfig("batching.byte_size", e.target.value ? parseInt(e.target.value) : 0)} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="ib-batch-period" className="text-xs">Period</Label>
                            <Input id="ib-batch-period" placeholder="e.g. 1s" value={batchingConfig.period || ""} onChange={(e) => updateInputBrokerConfig("batching.period", e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="ib-batch-jitter" className="text-xs">Jitter</Label>
                            <Input id="ib-batch-jitter" type="number" min={0} step={0.1} placeholder="0" value={batchingConfig.jitter || ""} onChange={(e) => updateInputBrokerConfig("batching.jitter", e.target.value ? parseFloat(e.target.value) : 0)} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="ib-batch-check" className="text-xs">Check</Label>
                          <Input id="ib-batch-check" placeholder="Bloblang query" value={batchingConfig.check || ""} onChange={(e) => updateInputBrokerConfig("batching.check", e.target.value)} />
                        </div>
                      </div>
                    </>
                  );
                })()}
                <p className="text-sm text-muted-foreground">
                  {editingNode.data.componentId === "broker" && editingNode.data.type === "input"
                    ? <>Use the <strong>+ Add</strong> button inside the group on the canvas to add child inputs. Click on a child input to configure it.</>
                    : editingNode.data.componentId === "broker"
                      ? <>Use the <strong>+ Add</strong> button inside the group on the canvas to add child outputs. Click on a child output to configure it.</>
                      : <>Use the <strong>+ Add</strong> button inside the group on the canvas to add child processors. Click on a child processor to configure it.</>
                  }
                </p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => { handleDeleteNode(editingNode.id); setEditingNodeId(null); }}
                >
                  {editingNode.data.componentId === "broker" ? (editingNode.data.type === "input" ? "Delete Broker Input Group" : "Delete Broker Output Group") : "Delete Catch Group"}
                </Button>
              </div>
            ) : (
              <NodeConfigPanel
                key={editingNodeId || "none"}
                allComponentSchemas={editingNode?.isGroupChild ? childFilteredSchemas : allComponentSchemas}
                selectedNode={editingNode}
                onUpdateNode={handleUpdateNode}
                onDeleteNode={(id) => { handleDeleteNode(id); setEditingNodeId(null); }}
                lockedComponentId={
                  editingNode?.data.type === "output" && isMcpServer ? "sync_response" : undefined
                }
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmNodeId} onOpenChange={(open: boolean) => { if (!open) setDeleteConfirmNodeId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Node</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this node? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmNodeId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteConfirmNodeId) {
                  handleDeleteNode(deleteConfirmNodeId);
                  setEditingNodeId(null);
                }
                setDeleteConfirmNodeId(null);
              }}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Context menu */}
      {contextMenu && (
        <div
          data-context-menu
          className="fixed z-50 min-w-[140px] rounded-md border bg-popover p-1 shadow-md"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={() => {
              setEditingNodeId(contextMenu.nodeId);
              setContextMenu(null);
            }}
          >
            Edit <span className="ml-auto text-xs text-muted-foreground">E</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={() => {
              setDeleteConfirmNodeId(contextMenu.nodeId);
              setContextMenu(null);
            }}
          >
            Delete <span className="ml-auto text-xs text-muted-foreground">Del</span>
          </button>
        </div>
      )}

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
