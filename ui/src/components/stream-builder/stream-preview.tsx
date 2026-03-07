import { useMemo, useState, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  type Node,
  type Edge,
  type ColorMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import * as yaml from "js-yaml";
import { Stream } from "@/lib/entities";
import {
  componentSchemas as rawComponentSchemas,
  componentLists,
} from "@/lib/component-schemas";
import type { AllComponentSchemas } from "./node-config-panel";

import { InputNode } from "./nodes/input-node";
import { ProcessorNode } from "./nodes/processor-node";
import { OutputNode } from "./nodes/output-node";
import { CatchGroupNode } from "./nodes/catch-group-node";
import { ChildProcessorNode } from "./nodes/child-processor-node";
import { PipelineEdge } from "./edges/pipeline-edge";

const nodeTypes = {
  inputNode: InputNode,
  processorNode: ProcessorNode,
  outputNode: OutputNode,
  catchGroupNode: CatchGroupNode,
  childProcessorNode: ChildProcessorNode,
};

const edgeTypes = {
  pipeline: PipelineEdge,
};

const NODE_SPACING_X = 350;
const NODE_Y = 200;
const CATCH_GROUP_WIDTH = 210;
const CATCH_CHILD_NODE_WIDTH = 150;
const CATCH_CHILD_NODE_HEIGHT = 55;
const CATCH_CHILD_GAP_Y = 40;
const CATCH_CHILD_X = 25;
const CATCH_CHILD_Y_START = 68;
const CATCH_GROUP_MIN_HEIGHT = 140;

function calcCatchGroupHeight(childCount: number): number {
  if (childCount === 0) return CATCH_GROUP_MIN_HEIGHT;
  return CATCH_CHILD_Y_START + childCount * CATCH_CHILD_NODE_HEIGHT + (childCount - 1) * CATCH_CHILD_GAP_Y + 48;
}

const transformComponentSchemas = (): AllComponentSchemas => {
  const allSchemas: AllComponentSchemas = {
    input: [],
    processor: [],
    output: [],
  };

  for (const typeKey of ["input", "pipeline", "output"] as const) {
    const list = componentLists[typeKey] || [];
    const targetTypeForApp = typeKey === "pipeline" ? "processor" : typeKey;

    let schemaCategory:
      | typeof rawComponentSchemas.input
      | typeof rawComponentSchemas.pipeline
      | typeof rawComponentSchemas.output
      | undefined;
    if (typeKey === "input") schemaCategory = rawComponentSchemas.input;
    else if (typeKey === "pipeline") schemaCategory = rawComponentSchemas.pipeline;
    else if (typeKey === "output") schemaCategory = rawComponentSchemas.output;

    list.forEach((componentName: string) => {
      const rawSchema = schemaCategory?.[componentName as keyof typeof schemaCategory];
      if (rawSchema) {
        allSchemas[targetTypeForApp].push({
          id: componentName,
          name: (rawSchema as any).title || componentName,
          component: componentName,
          type: targetTypeForApp,
          schema: rawSchema,
        });
      }
    });
  }
  return allSchemas;
};

interface StreamPreviewProps {
  stream: Stream;
}

function StreamPreviewContent({ stream }: StreamPreviewProps) {
  const componentSchemas = useMemo(() => transformComponentSchemas(), []);
  const [colorMode, setColorMode] = useState<ColorMode>("light");

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setColorMode(isDark ? "dark" : "light");
    const observer = new MutationObserver(() => {
      setColorMode(document.documentElement.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const getComponentDisplayName = (componentId: string, type: "input" | "processor" | "output"): string => {
    const component = componentSchemas[type].find((c) => c.id === componentId);
    return component ? `${component.name} (${component.component})` : componentId;
  };

  const { nodes, edges } = useMemo(() => {
    const flowNodes: Node[] = [];
    const flowEdges: Edge[] = [];
    let xPos = 0;
    let prevNodeId: string | null = null;

    const inputId = uuidv4();
    flowNodes.push({
      id: inputId,
      type: "inputNode",
      position: { x: xPos, y: NODE_Y },
      data: {
        label: stream.input_label || "Input",
        type: "input",
        componentId: stream.input_component,
        component: getComponentDisplayName(stream.input_component, "input"),
        configYaml: stream.input_config,
        nodeId: inputId,
        readOnly: true,
      },
    });
    prevNodeId = inputId;
    xPos += NODE_SPACING_X;

    if (stream.processors && stream.processors.length > 0) {
      for (const proc of stream.processors) {
        const id = uuidv4();

        if (proc.component === "catch") {
          let childConfigs: any[] = [];
          if (proc.config?.trim()) {
            try {
              const parsed = yaml.load(proc.config);
              if (Array.isArray(parsed)) childConfigs = parsed;
            } catch {}
          }

          const childCount = childConfigs.length;
          const groupHeight = calcCatchGroupHeight(childCount);

          flowNodes.push({
            id,
            type: "catchGroupNode",
            position: { x: xPos, y: NODE_Y - 25 },
            style: { width: CATCH_GROUP_WIDTH, height: groupHeight },
            data: {
              label: proc.label || "catch",
              type: "processor",
              componentId: "catch",
              component: "catch",
              nodeId: id,
              isGroup: true,
              childCount,
              configYaml: "",
              readOnly: true,
            },
          });

          let prevChildId: string | null = null;
          childConfigs.forEach((procObj, i) => {
            const componentName = Object.keys(procObj).find((k) => k !== "label") || Object.keys(procObj)[0];
            const config = procObj[componentName];
            const childLabel = procObj.label as string | undefined;
            const schema = componentSchemas.processor.find(
              (p) => p.component === componentName || p.id === componentName
            );
            const childId = uuidv4();
            flowNodes.push({
              id: childId,
              type: "childProcessorNode",
              position: {
                x: CATCH_CHILD_X,
                y: CATCH_CHILD_Y_START + i * (CATCH_CHILD_NODE_HEIGHT + CATCH_CHILD_GAP_Y),
              },
              parentId: id,
              extent: "parent" as const,
              data: {
                label: childLabel || schema?.id || componentName,
                type: "processor",
                componentId: schema?.id || componentName,
                component: componentName,
                configYaml:
                  typeof config === "string"
                    ? config
                    : config && Object.keys(config).length > 0
                      ? yaml.dump(config, { lineWidth: -1, noRefs: true })
                      : "",
                nodeId: childId,
                readOnly: true,
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
            data: {
              label: proc.label || "Processor",
              type: "processor",
              componentId: proc.component,
              component: getComponentDisplayName(proc.component, "processor"),
              configYaml: proc.config,
              nodeId: id,
              readOnly: true,
            },
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
    }

    const outputId = uuidv4();
    flowNodes.push({
      id: outputId,
      type: "outputNode",
      position: { x: xPos, y: NODE_Y },
      data: {
        label: stream.output_label || "Output",
        type: "output",
        componentId: stream.output_component,
        component: getComponentDisplayName(stream.output_component, "output"),
        configYaml: stream.output_config,
        nodeId: outputId,
        readOnly: true,
      },
    });
    if (prevNodeId) {
      flowEdges.push({
        id: `e-${prevNodeId}-${outputId}`,
        source: prevNodeId,
        target: outputId,
        type: "pipeline",
      });
    }

    return { nodes: flowNodes, edges: flowEdges };
  }, [stream, componentSchemas]);

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode={colorMode}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={"dots" as any} />
      </ReactFlow>
    </div>
  );
}

export default function StreamPreview({ stream }: StreamPreviewProps) {
  return (
    <ReactFlowProvider>
      <StreamPreviewContent stream={stream} />
    </ReactFlowProvider>
  );
}
