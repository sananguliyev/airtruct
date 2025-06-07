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
import { InlineYamlEditor } from "../inline-yaml-editor";

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
  componentId: string; // Store the actual component ID for schema lookup
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
      componentId: stream.input_component,
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
          componentId: processor.component,
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
      componentId: stream.output_component,
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
      className="w-full mx-auto shadow-md hover:shadow-lg transition-shadow border-border bg-card"
      style={{ 
        minHeight: "70px",
        maxWidth: "480px", 
        minWidth: "300px" 
      }}
    >
      <CardHeader className="p-4 pb-2 flex-row justify-between items-start">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-semibold truncate text-card-foreground">
            {node.label}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1 break-words">
            {node.component}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
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
          {node.config && node.config.trim() && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleViewConfig(node)}
              className="h-7 w-7 hover:bg-muted"
              title="View Configuration"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );

  const renderSection = (type: "input" | "processor" | "output", labelText: string, nodes: NodeData[]) => (
    <div className="w-full">
      <div 
        className="border-2 border-dashed border-border rounded-lg p-4 bg-card/50 relative"
        style={{ minHeight: nodes.length === 0 ? "120px" : "auto" }}
      >
        <div className="absolute -top-3 left-4 bg-background px-2 text-sm font-medium text-muted-foreground">
          {labelText}
        </div>
        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm min-h-[80px]">
            No {type} configured
          </div>
        ) : (
          <div className="space-y-3 flex flex-col items-center">
            {nodes.map((node, index) => (
              <React.Fragment key={index}>
                <div className="w-full flex justify-center">
                  <NodeCard node={node} />
                </div>
                {type === "processor" && index < nodes.length - 1 && (
                  <div className="flex justify-center w-full">
                    <div className="flex flex-col items-center">
                      <div className="w-0.5 h-4 bg-border"></div>
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-border"></div>
                    </div>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="w-full">
        <div className="p-6">
          <div className="max-w-2xl mx-auto space-y-8">
            {renderSection("input", "Input", inputNodes)}
            
            {/* Connection arrow */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-border"></div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-border"></div>
              </div>
            </div>
            
            {renderSection("processor", "Pipeline", processorNodes)}
            
            {/* Connection arrow */}
            <div className="flex justify-center">
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-border"></div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-border"></div>
              </div>
            </div>
            
            {renderSection("output", "Output", outputNodes)}
          </div>
        </div>
      </div>

      {/* Configuration Dialog */}
      <Dialog
        open={configDialog.open}
        onOpenChange={(open) => setConfigDialog({ open, node: null })}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-lg font-semibold">
              {configDialog.node?.label} - Configuration (Read-only)
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-muted/30 rounded-md border">
                         {configDialog.node && (() => {
               const component = componentSchemas[configDialog.node.type].find(
                 (c) => c.id === configDialog.node?.componentId
               );
               
               if (!component?.schema) {
                 return (
                   <div className="flex items-center justify-center h-32 text-muted-foreground">
                     No configuration schema available for this component
                   </div>
                 );
               }

               if (!configDialog.node.config || !configDialog.node.config.trim()) {
                 return (
                   <div className="flex items-center justify-center h-32 text-muted-foreground">
                     No configuration data available
                   </div>
                 );
               }

               return (
                 <div className="pointer-events-none opacity-90">
                   <InlineYamlEditor
                     schema={component.schema}
                     value={configDialog.node.config}
                     onChange={() => {}} // Read-only - no-op function
                     availableProcessors={componentSchemas.processor}
                     availableInputs={componentSchemas.input}
                     availableOutputs={componentSchemas.output}
                     previewMode={true}
                   />
                 </div>
               );
             })()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
