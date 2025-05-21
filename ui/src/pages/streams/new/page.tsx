import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast";
import { StreamBuilder } from "@/components/stream-builder/stream-builder";
import type { Node, Edge } from "reactflow";
import type { StreamNodeData } from "@/components/stream-builder/stream-node";
import { ComponentConfig } from "@/lib/entities";
import { createStream, fetchComponentConfigs } from "@/lib/api";

export default function NewStreamPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [componentConfigsData, setComponentConfigsData] = useState<
    ComponentConfig[]
  >([] as ComponentConfig[]);

  useEffect(() => {
    async function loadComponentConfigs() {
      try {
        const data = await fetchComponentConfigs();
        setComponentConfigsData(data);
      } catch (error) {
        console.error("Error fetching component configs data:", error);
      }
    }

    loadComponentConfigs();
  }, []);

  const handleSaveStream = async (data: {
    name: string;
    status: string;
    nodes: Node<StreamNodeData>[];
    edges: Edge[];
  }) => {
    setIsSubmitting(true);

    try {
      // Extract input, processors, and output from the nodes
      const inputNode = data.nodes.find((node) => node.data.type === "input");
      const processorNodes = data.nodes.filter(
        (node) => node.data.type === "processor"
      );
      const outputNode = data.nodes.find((node) => node.data.type === "output");

      // Validate the stream configuration
      if (!inputNode || !outputNode) {
        throw new Error("Stream must have at least one input and one output");
      }

      // Check if the stream is properly connected
      const isConnected = validateConnections(data.nodes, data.edges);
      if (!isConnected) {
        throw new Error("All nodes must be connected in a valid flow");
      }

      // Create processors array
      const processors = processorNodes.map((node) => ({
        label: node.data.label,
        processorID: parseInt(node.data.componentId || "0"),
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

      const newStream = {
        name: data.name,
        status: data.status,
        inputLabel: inputNode.data.label,
        inputID: inputComponentID,
        processors: processors.length > 0 ? processors : [],
        outputLabel: outputNode.data.label,
        outputID: outputComponentID,
        parentID: "",
        isHttpServer: false,
      };

      const response = await createStream(newStream);

      // Show success toast
      addToast({
        id: "stream-created",
        title: "Stream Created",
        description: `${data.name} has been created successfully.`,
        variant: "success",
      });

      // Navigate back to the streams list
      navigate("/streams");
    } catch (error) {
      // Show error toast
      addToast({
        id: "stream-error",
        title: "Error Creating Stream",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate that all nodes are connected in a valid flow
  const validateConnections = (nodes: Node[], edges: Edge[]): boolean => {
    if (nodes.length <= 1) return false;

    // Check if there's at least one input and one output
    const hasInput = nodes.some((node) => node.data.type === "input");
    const hasOutput = nodes.some((node) => node.data.type === "output");

    if (!hasInput || !hasOutput) return false;

    // Check if all nodes are connected
    const connectedNodeIds = new Set<string>();

    // Start with input nodes
    const inputNodes = nodes.filter((node) => node.data.type === "input");
    inputNodes.forEach((node) => connectedNodeIds.add(node.id));

    // Traverse the graph
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

    // Check if all nodes are in the connected set
    return connectedNodeIds.size === nodes.length;
  };

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
          componentConfigsData={componentConfigsData}
          onSave={handleSaveStream}
        />
      )}
    </div>
  );
}
