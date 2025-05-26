import React, { useMemo, useState } from "react";
import { Stream } from "@/lib/entities";
import { 
  componentSchemas as rawComponentSchemas, 
  componentLists 
} from "@/lib/component-schemas";
import type { AllComponentSchemas } from "./node-config-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge-variants";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Editor from "@monaco-editor/react";

const transformComponentSchemas = (): AllComponentSchemas => {
  const allSchemas: AllComponentSchemas = {
    input: [],
    processor: [],
    output: [],
  };

  for (const typeKey of ["input", "pipeline", "output"] as const) {
    const list = componentLists[typeKey] || [];
    const targetTypeForApp = typeKey === 'pipeline' ? 'processor' : typeKey;
    
    let schemaCategory: typeof rawComponentSchemas.input | typeof rawComponentSchemas.pipeline | typeof rawComponentSchemas.output | undefined;
    if (typeKey === 'input') schemaCategory = rawComponentSchemas.input;
    else if (typeKey === 'pipeline') schemaCategory = rawComponentSchemas.pipeline;
    else if (typeKey === 'output') schemaCategory = rawComponentSchemas.output;

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

interface NodeData {
  label: string;
  type: "input" | "processor" | "output";
  component: string;
  config: string;
  status: string;
}

export default function StreamPreview({ stream }: StreamPreviewProps) {
  const componentSchemas = useMemo(() => transformComponentSchemas(), []);
  const [configDialog, setConfigDialog] = useState<{ open: boolean; node: NodeData | null }>({
    open: false,
    node: null,
  });

  // Helper to get component display name
  const getComponentDisplayName = (componentId: string, type: "input" | "processor" | "output"): string => {
    const component = componentSchemas[type].find((c) => c.id === componentId);
    return component ? `${component.name} (${component.component})` : componentId;
  };

  const { inputNodes, processorNodes, outputNodes } = useMemo(() => {
    const input: NodeData[] = [];
    const processors: NodeData[] = [];
    const output: NodeData[] = [];

    // Add input node
    input.push({
      label: stream.input_label || "Input",
      type: "input",
      component: getComponentDisplayName(stream.input_component, "input"),
      config: stream.input_config,
      status: stream.status,
    });

    // Add processor nodes
    if (stream.processors && stream.processors.length > 0) {
      stream.processors.forEach((processor) => {
        processors.push({
          label: processor.label || "Processor",
          type: "processor",
          component: getComponentDisplayName(processor.component, "processor"),
          config: processor.config,
          status: stream.status,
        });
      });
    }

    // Add output node
    output.push({
      label: stream.output_label || "Output",
      type: "output",
      component: getComponentDisplayName(stream.output_component, "output"),
      config: stream.output_config,
      status: stream.status,
    });

    return { inputNodes: input, processorNodes: processors, outputNodes: output };
  }, [stream, componentSchemas]);

  const handleViewConfig = (node: NodeData) => {
    setConfigDialog({ open: true, node });
  };

  const NodeCard = ({ node }: { node: NodeData }) => (
    <Card 
      className="w-full mx-auto shadow-md"
      style={{ 
        minHeight: "60px",
        maxWidth: "500px", 
        minWidth: "240px" 
      }}
    >
      <CardHeader className="p-3 pb-1 flex-row justify-between items-center">
        <CardTitle className="text-sm font-medium truncate">{node.label}</CardTitle>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              node.status === "active"
                ? "info"
                : node.status === "paused"
                ? "warning"
                : node.status === "completed"
                ? "success"
                : "secondary"
            }
            className="text-xs"
          >
            {node.status}
          </Badge>
          {node.config && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleViewConfig(node)}
              className="h-6 w-6"
              title="View Configuration"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-xs text-muted-foreground break-all">
          {node.component}
        </p>
      </CardContent>
    </Card>
  );

  const renderSection = (type: "input" | "processor" | "output", labelText: string, nodes: NodeData[]) => (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-center">{labelText}</h3>
      </div>
      <div 
        className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 bg-muted/10"
        style={{ minHeight: "150px" }}
      >
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No {type} configured
          </div>
        ) : (
          <div className="space-y-4">
            {nodes.map((node, index) => (
              <NodeCard key={index} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {renderSection("input", "Input", inputNodes)}
            {renderSection("processor", "Pipeline", processorNodes)}
            {renderSection("output", "Output", outputNodes)}
          </div>
        </div>
      </div>

      {/* Configuration Dialog */}
      <Dialog
        open={configDialog.open}
        onOpenChange={(open) => setConfigDialog({ open, node: null })}
      >
        <DialogContent className="max-w-3xl h-[70vh]">
          <DialogHeader>
            <DialogTitle>
              {configDialog.node?.label} - Configuration
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            <Editor 
              height="100%"
              language="yaml"
              theme="vs-dark"
              value={configDialog.node?.config || ""}
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                wordWrap: "on",
                automaticLayout: true,
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
