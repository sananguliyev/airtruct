// src/pages/Streams/EditPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "../../../components/toast"
import { StreamBuilder } from "../../../components/stream-builder/stream-builder";
import { ComponentConfig, Stream, StreamProcessor } from "../../../types/entities";
import { v4 as uuidv4 } from "uuid";
import type { Node, Edge } from "reactflow";
import type { StreamNodeData } from "../../../components/stream-builder/stream-node";

export default function EditStreamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [componentConfigsData, setComponentConfigsData] = useState<ComponentConfig[]>([]);
  const [streamData, setStreamData] = useState<{
    name: string;
    status: string;
    nodes: Node<StreamNodeData>[];
    edges: Edge[];
  } | null>(null);

  useEffect(() => {
    async function fetchComponentConfigs() {
      try {
        const response = await fetch("http://localhost:8080/component-configs");
        if (!response.ok) throw new Error("Response not ok");
        const data = await response.json();
        setComponentConfigsData(
          data.map((componentConfig: any) => ({
            id: componentConfig.id,
            name: componentConfig.name,
            type:
              componentConfig.section === "pipeline"
                ? "processor"
                : componentConfig.section,
            section: componentConfig.section,
            component: componentConfig.component,
            createdAt: new Date(componentConfig.created_at).toLocaleString(),
          }))
        );
      } catch (error) {
        console.error("Error fetching component configs data:", error);
      }
    }
    fetchComponentConfigs();
  }, []);

  useEffect(() => {
    setIsLoading(true);
    fetch(`http://localhost:8080/streams/${id}`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch stream");
        return response.json();
      })
      .then((streamResponse: any) => {
        // Convert streamResponse to visual nodes/edges for StreamBuilder
        const updatedStream = {
          id: streamResponse.id,
          name: streamResponse.name,
          status: streamResponse.status,
          input: streamResponse.input,
          inputLabel: streamResponse.input_label,
          inputID: streamResponse.input_id,
          processors: streamResponse.processors.map((processor: any) => ({
            processorID: processor.processor_id,
            label: processor.label,
            createdAt: new Date(processor.created_at).toLocaleString(),
          })),
          output: streamResponse.output,
          outputLabel: streamResponse.output_label,
          outputID: streamResponse.output_id,
          createdAt: new Date(streamResponse.created_at).toLocaleString(),
          visualData: streamResponse.visualData || undefined,
        };

        // Visual data
        if (updatedStream.visualData) {
          setStreamData({
            name: updatedStream.name,
            status: updatedStream.status,
            nodes: updatedStream.visualData.nodes,
            edges: updatedStream.visualData.edges,
          });
        } else {
          // Build nodes/edges from stream config
          const nodes: Node<StreamNodeData>[] = [];
          const edges: Edge[] = [];
          // Input node
          const inputNode: Node<StreamNodeData> = {
            id: uuidv4(),
            type: "streamNode",
            position: { x: 100, y: 100 },
            data: {
              label: updatedStream.inputLabel || "Input",
              type: "input",
              component: updatedStream.inputID,
              componentId: updatedStream.inputID,
              status: updatedStream.status,
            },
          };
          nodes.push(inputNode);
          let lastNodeId = inputNode.id;
          // Processor nodes
          if (updatedStream.processors && updatedStream.processors.length > 0) {
            updatedStream.processors.forEach((processor: StreamProcessor, idx: number) => {
              const processorNode: Node<StreamNodeData> = {
                id: processor.processorID || uuidv4(),
                type: "streamNode",
                position: { x: 400, y: 100 + idx * 150 },
                data: {
                  label: processor.label || `Processor ${idx + 1}`,
                  type: "processor",
                  component: processor.processorID,
                  componentId: processor.processorID,
                  status: updatedStream.status,
                },
              };
              nodes.push(processorNode);
              edges.push({
                id: `e-${lastNodeId}-${processorNode.id}`,
                source: lastNodeId,
                target: processorNode.id,
                animated: true,
              });
              lastNodeId = processorNode.id;
            });
          }
          // Output node
          const outputNode: Node<StreamNodeData> = {
            id: uuidv4(),
            type: "streamNode",
            position: { x: 700, y: 100 },
            data: {
              label: updatedStream.outputLabel || "Output",
              type: "output",
              component: updatedStream.outputID,
              componentId: updatedStream.outputID,
              status: updatedStream.status,
            },
          };
          nodes.push(outputNode);
          edges.push({
            id: `e-${lastNodeId}-${outputNode.id}`,
            source: lastNodeId,
            target: outputNode.id,
            animated: true,
          });
          setStreamData({
            name: updatedStream.name,
            status: updatedStream.status,
            nodes,
            edges,
          });
        }
        setIsLoading(false);
      })
      .catch((error) => {
        addToast({
          id: "fetch-error",
          title: "Error Fetching Stream",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "error",
        });
        navigate("/streams");
      });
  }, [id, navigate, addToast]);

  const handleSaveStream = async (data: {
    name: string;
    status: string;
    nodes: Node<StreamNodeData>[];
    edges: Edge[];
  }) => {
    setIsSubmitting(true);
    try {
      const inputNode = data.nodes.find((node) => node.data.type === "input");
      const processorNodes = data.nodes.filter((node) => node.data.type === "processor");
      const outputNode = data.nodes.find((node) => node.data.type === "output");

      if (!inputNode || !outputNode) {
        throw new Error("Stream must have at least one input and one output");
      }

      const isConnected = validateConnections(data.nodes, data.edges);
      if (!isConnected) {
        throw new Error("All nodes must be connected in a valid flow");
      }

      const processors = processorNodes.map((node) => ({
        label: node.data.label,
        processor_id: node.data.componentId,
      }));

      let inputComponentID: number = 0;
      let outputComponentID: number = 0;
      if (inputNode.data.componentId && outputNode.data.componentId) {
        inputComponentID = parseInt(inputNode.data.componentId);
        outputComponentID = parseInt(outputNode.data.componentId);
      } else {
        throw new Error(
          "Not possible to create stream without input and output component IDs"
        );
      }

      const updatedStreamData = {
        name: data.name,
        status: data.status,
        input_label: inputNode.data.label,
        input_id: inputComponentID,
        processors,
        output_label: outputNode.data.label,
        output_id: outputComponentID,
      };

      const response = await fetch(`http://localhost:8080/streams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStreamData),
      });
      if (!response.ok) throw new Error("Failed to update stream");

      addToast({
        id: "stream-updated",
        title: "Stream Updated",
        description: `${data.name} has been updated successfully.`,
        variant: "success",
      });

      navigate("/streams");
    } catch (error) {
      addToast({
        id: "stream-error",
        title: "Error Updating Stream",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateConnections = (nodes: Node[], edges: Edge[]): boolean => {
    if (nodes.length <= 1) return false;
    const hasInput = nodes.some((node) => node.data.type === "input");
    const hasOutput = nodes.some((node) => node.data.type === "output");
    if (!hasInput || !hasOutput) return false;
    const connectedNodeIds = new Set<string>();
    const inputNodes = nodes.filter((node) => node.data.type === "input");
    inputNodes.forEach((node) => connectedNodeIds.add(node.id));
    let newNodesAdded = true;
    while (newNodesAdded) {
      newNodesAdded = false;
      edges.forEach((edge) => {
        if (
          connectedNodeIds.has(edge.source) &&
          !connectedNodeIds.has(edge.target)
        ) {
          connectedNodeIds.add(edge.target);
          newNodesAdded = true;
        }
      });
    }
    return connectedNodeIds.size === nodes.length;
  };

  if (isLoading || !streamData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
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
          componentConfigsData={componentConfigsData}
          initialData={streamData!}
          onSave={handleSaveStream}
        />
      )}
    </div>
  );
}
