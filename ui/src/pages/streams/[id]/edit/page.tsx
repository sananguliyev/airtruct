import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast";
import { StreamBuilder } from "@/components/stream-builder/stream-builder";
import type { Node, Edge } from "reactflow";
import type { StreamNodeData } from "@/components/stream-builder/stream-node";
import { v4 as uuidv4 } from "uuid";
import { fetchStream, updateStream } from "@/lib/api";
import { 
  componentSchemas as rawComponentSchemas, 
  componentLists 
} from "@/lib/component-schemas";
import type { AllComponentSchemas } from "@/components/stream-builder/node-config-panel";

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

export default function EditStreamPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamData, setStreamData] = useState<{
    name: string;
    status: string;
    nodes: StreamNodeData[];
  } | null>(null);
  const [transformedSchemas, setTransformedSchemas] = useState<AllComponentSchemas | null>(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    setTransformedSchemas(transformComponentSchemas());
  }, []);

  useEffect(() => {
    async function loadData() {
      if (loadedRef.current || !transformedSchemas) return;
      loadedRef.current = true;

      try {
        setIsLoading(true);
        const streamResponse = await fetchStream(id || "");
        
        // Create visual data from the stream configuration
        const nodes: StreamNodeData[] = [];

        // Create input node
        const inputNode: StreamNodeData = {
          label: streamResponse.input_label || "Input",
          type: "input",
          component: getComponentDisplayName(streamResponse.input_component, "input"),
          componentId: streamResponse.input_component,
          configYaml: streamResponse.input_config || "",
          status: streamResponse.status,
        };
        nodes.push(inputNode);

        // Create processor nodes
        if (streamResponse.processors && streamResponse.processors.length > 0) {
          streamResponse.processors.forEach((processor: any) => {
            const processorNode: StreamNodeData = {
              label: processor.label || "Processor",
              type: "processor",
              component: getComponentDisplayName(processor.component, "processor"),
              componentId: processor.component,
              configYaml: processor.config || "",
              status: streamResponse.status,
            };
            nodes.push(processorNode);
          });
        }

        // Create output node
        const outputNode: StreamNodeData = {
          label: streamResponse.output_label || "Output",
          type: "output",
          component: getComponentDisplayName(streamResponse.output_component, "output"),
          componentId: streamResponse.output_component,
          configYaml: streamResponse.output_config || "",
          status: streamResponse.status,
        };
        nodes.push(outputNode);

        setStreamData({
          name: streamResponse.name,
          status: streamResponse.status,
          nodes,
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        addToast({
          id: "fetch-error",
          title: "Error Loading Data",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          variant: "error",
        });
        navigate("/streams");
      }
    }

    loadData();
  }, [id, navigate, transformedSchemas]);

  const handleSaveStream = async (data: { name: string; status: string; nodes: StreamNodeData[] }) => {
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

      const updatedStreamData = {
        name: data.name,
        status: data.status,
        input_component: inputComponent.component,
        input_label: inputNode.label,
        input_config: inputNode.configYaml || "",
        output_component: outputComponent.component,
        output_label: outputNode.label,
        output_config: outputNode.configYaml || "",
        processors: processors
      };

      await updateStream(id || "", updatedStreamData);

      // Show success toast
      addToast({
        id: "stream-updated",
        title: "Stream Updated",
        description: `${data.name} has been updated successfully.`,
        variant: "success",
      });

      // Navigate back to the streams list
      navigate("/streams");
    } catch (error) {
      // Show error toast
      addToast({
        id: "stream-error",
        title: "Error Updating Stream",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get component display name
  const getComponentDisplayName = (componentId: string, type: "input" | "processor" | "output"): string => {
    if (!transformedSchemas) return componentId;
    
    const component = transformedSchemas[type].find((c) => c.id === componentId);
    return component ? `${component.name} (${component.component})` : componentId;
  };

  if (isLoading || !transformedSchemas) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Stream</h1>
        <p className="text-muted-foreground">
          Modify your data processing pipeline visually
        </p>
      </div>

      {isSubmitting ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <StreamBuilder
          allComponentSchemas={transformedSchemas}
          initialData={streamData!}
          onSave={handleSaveStream}
        />
      )}
    </div>
  );
}
