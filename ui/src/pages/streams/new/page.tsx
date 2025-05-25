import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast";
import { StreamBuilder } from "@/components/stream-builder/stream-builder";
import type { Node, Edge } from "reactflow";
import type { StreamNodeData } from "@/components/stream-builder/stream-node";
import { createStream, fetchComponentConfigs } from "@/lib/api";
import { 
  componentSchemas as rawComponentSchemas, 
  componentLists 
} from "@/lib/component-schemas";
import type { AllComponentSchemas, ComponentSchema } from "@/components/stream-builder/node-config-panel";

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

  const handleSaveStream = async (data: {
    name: string;
    status: string;
    nodes: Node<StreamNodeData>[];
    edges: Edge[];
  }) => {
    setIsSubmitting(true);
    try {
      const streamData = {
        id: uuidv4(),
        ...data,
      };
      await createStream(streamData as any);
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
        description: "Failed to create stream.",
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
        />
      )}
    </div>
  );
}
