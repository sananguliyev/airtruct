import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast";
import { StreamBuilder } from "@/components/stream-builder/stream-builder";
import { createStream, validateStream, tryStream } from "@/lib/api";
import { 
  componentSchemas as rawComponentSchemas, 
  componentLists 
} from "@/lib/component-schemas";
import type { AllComponentSchemas, ComponentSchema } from "@/components/stream-builder/node-config-panel";

// Define StreamNodeData type locally since the file was deleted
export interface StreamNodeData {
  label: string;
  type: "input" | "processor" | "output";
  componentId?: string;
  component?: string;
  configYaml?: string;
}

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

export default function NewStreamPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transformedSchemas, setTransformedSchemas] = useState<AllComponentSchemas | null>(null);

  useEffect(() => {
    setTransformedSchemas(transformComponentSchemas());
  }, []);

  const handleValidateStream = async (data: { name: string; status: string; bufferId?: number; nodes: StreamNodeData[] }) => {
    const inputNode = data.nodes.find((node) => node.type === "input");
    const processorNodes = data.nodes.filter((node) => node.type === "processor");
    const outputNode = data.nodes.find((node) => node.type === "output");
    if (!inputNode || !outputNode || !inputNode.componentId || !outputNode.componentId) {
      return { valid: false, error: "Stream must have an input and output with components selected." };
    }
    const inputComponent = transformedSchemas?.input.find(c => c.id === inputNode.componentId);
    const outputComponent = transformedSchemas?.output.find(c => c.id === outputNode.componentId);
    if (!inputComponent || !outputComponent) {
      return { valid: false, error: "Selected components not found in available schemas." };
    }
    return validateStream({
      input_component: inputComponent.component,
      input_label: inputNode.label,
      input_config: inputNode.configYaml || "",
      output_component: outputComponent.component,
      output_label: outputNode.label,
      output_config: outputNode.configYaml || "",
      processors: processorNodes.map(node => {
        const comp = transformedSchemas?.processor.find(c => c.id === node.componentId);
        return { label: node.label, component: comp?.component || node.componentId || "", config: node.configYaml || "" };
      }),
    });
  };

  const handleTryStream = async (data: { processors: Array<{ label: string; component: string; config: string }>; messages: Array<{ content: string }> }) => {
    return tryStream(data);
  };

  const handleSaveStream = async (data: { name: string; status: string; bufferId?: number; nodes: StreamNodeData[] }) => {
    setIsSubmitting(true);
    try {
      // Extract input, processors, and output from the nodes
      const inputNode = data.nodes.find((node) => node.type === "input");
      const processorNodes = data.nodes.filter((node) => node.type === "processor");
      const outputNode = data.nodes.find((node) => node.type === "output");

      // Validate the stream configuration
      if (!inputNode || !outputNode) {
        throw new Error("Stream must have at least one input and one output");
      }

      // Validate that nodes have required data
      if (!inputNode.componentId || !outputNode.componentId) {
        throw new Error("Input and output nodes must have components selected");
      }

      // Find component details from schemas
      const inputComponent = transformedSchemas?.input.find(c => c.id === inputNode.componentId);
      const outputComponent = transformedSchemas?.output.find(c => c.id === outputNode.componentId);

      if (!inputComponent || !outputComponent) {
        throw new Error("Selected components not found in available schemas");
      }

      // Create processors array
      const processors = processorNodes.map((node) => {
        if (!node.componentId) {
          throw new Error(`Processor node "${node.label}" must have a component selected`);
        }
        
        const processorComponent = transformedSchemas?.processor.find(c => c.id === node.componentId);
        if (!processorComponent) {
          throw new Error(`Processor component not found for node "${node.label}"`);
        }

        return {
          label: node.label,
          component: processorComponent.component,
          config: node.configYaml || ""
        };
      });

      const streamData = {
        name: data.name,
        status: data.status,
        input_component: inputComponent.component,
        input_label: inputNode.label,
        input_config: inputNode.configYaml || "",
        output_component: outputComponent.component,
        output_label: outputNode.label,
        output_config: outputNode.configYaml || "",
        buffer_id: data.bufferId,
        processors: processors
      };

      await createStream(streamData);
      addToast({
        id: "stream-created",
        title: "Stream Created",
        description: `${data.name} has been created successfully.`,
        variant: "success",
      });
      navigate("/streams");
    } catch (error) {
      console.error("Error creating stream:", error);
      addToast({
        id: "stream-creation-error",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create stream.",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!transformedSchemas) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Stream</h1>
        <p className="text-muted-foreground">
          Design your data processing pipeline visually
        </p>
      </div>

      {isSubmitting ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <StreamBuilder
          allComponentSchemas={transformedSchemas}
          onSave={handleSaveStream}
          onValidate={handleValidateStream}
          onTry={handleTryStream}
        />
      )}
    </div>
  );
}
