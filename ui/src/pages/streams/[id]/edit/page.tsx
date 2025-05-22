import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast";
import { StreamBuilder } from "@/components/stream-builder/stream-builder";
import type { Node, Edge } from "reactflow";
import type { StreamNodeData } from "@/components/stream-builder/stream-node";
import { v4 as uuidv4 } from "uuid";
import { ComponentConfig, Stream, StreamProcessor } from "@/lib/entities";
import { fetchComponentConfigs, fetchStream, updateStream } from "@/lib/api";
export default function EditStreamPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [streamData, setStreamData] = useState<{
    name: string;
    status: string;
    nodes: Node<StreamNodeData>[];
    edges: Edge[];
  } | null>(null);
  const [componentConfigsData, setComponentConfigsData] = useState<
    ComponentConfig[]
  >([] as ComponentConfig[]);
  const [stream, setStream] = useState<Stream | null>();
  const loadedRef = useRef(false);

  useEffect(() => {
    async function loadData() {
      if (loadedRef.current) return;
      loadedRef.current = true;

      try {
        const data = await fetchComponentConfigs();
        setComponentConfigsData(data);
        
        setIsLoading(true);
        const streamResponse = await fetchStream(id || "");
        setStream(streamResponse);
        // If the stream has visual data, use it
        if (streamResponse.visualData) {
          setStreamData({
            name: streamResponse.name,
            status: streamResponse.status,
            nodes: streamResponse.visualData.nodes,
            edges: streamResponse.visualData.edges,
          });
        } else {
          // Otherwise, create visual data from the stream configuration
          const nodes: Node<StreamNodeData>[] = [];
          const edges: Edge[] = [];

          // Create input node
          const inputNode: Node<StreamNodeData> = {
            id: uuidv4(),
            type: "streamNode",
            position: { x: 100, y: 100 },
            data: {
              label: streamResponse.inputLabel || "Input",
              type: "input",
              component: getComponentLabel(streamResponse.inputID.toString(), data),
              componentId: streamResponse.inputID.toString(),
              status: streamResponse.status,
            },
          };
          nodes.push(inputNode);

          // Create processor nodes
          let lastNodeId = inputNode.id;
          if (
            streamResponse.processors &&
            streamResponse.processors.length > 0
          ) {
            streamResponse.processors.forEach(
              (processor: StreamProcessor, index: number) => {
                const processorNode: Node<StreamNodeData> = {
                  id: uuidv4(),
                  type: "streamNode",
                  position: { x: 400, y: 100 + index * 150 },
                  data: {
                    label: processor.label || `Processor ${index + 1}`,
                    type: "processor",
                    component: getComponentLabel(processor.processorID.toString(), data),
                    componentId: processor.processorID.toString(),
                    status: streamResponse.status,
                  },
                };
                nodes.push(processorNode);

                // Connect to previous node
                edges.push({
                  id: `e-${lastNodeId}-${processorNode.id}`,
                  source: lastNodeId,
                  target: processorNode.id,
                  animated: true,
                });

                lastNodeId = processorNode.id;
              }
            );
          }

          // Create output node
          const outputNode: Node<StreamNodeData> = {
            id: uuidv4(),
            type: "streamNode",
            position: { x: 700, y: 100 },
            data: {
              label: streamResponse.outputLabel || "Output",
              type: "output",
              component: getComponentLabel(streamResponse.outputID.toString(), data),
              componentId: streamResponse.outputID.toString(),
              status: streamResponse.status,
            },
          };
          nodes.push(outputNode);

          // Connect to last processor or input
          edges.push({
            id: `e-${lastNodeId}-${outputNode.id}`,
            source: lastNodeId,
            target: outputNode.id,
            animated: true,
          });

          setStreamData({
            name: streamResponse.name,
            status: streamResponse.status,
            nodes,
            edges,
          });
        }

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
  }, [id, navigate]);

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

      if (!inputNode.data.componentId || !outputNode.data.componentId)  {
        throw new Error(
          "Not possible to create stream without input and output component IDs"
        );
      }

      const updatedStreamData = {
        name: data.name,
        status: data.status,
        inputLabel: inputNode.data.label,
        inputID: parseInt(inputNode.data.componentId || "0"),
        processors,
        outputLabel: outputNode.data.label,
        outputID: parseInt(outputNode.data.componentId || "0"),
        parentID: stream?.parentID || "",
        isHttpServer: stream?.isHttpServer || false,
      };

      const response = await updateStream(id || "", updatedStreamData);

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

  // Helper to get component label from ID
  const getComponentLabel = (componentId: string, configs: ComponentConfig[]): string => {
    const component = configs.find((c) => c.id === componentId);
    return component ? `${component.name} (${component.component})` : "";
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

  if (isLoading) {
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
          componentConfigsData={componentConfigsData}
          initialData={streamData!}
          onSave={handleSaveStream}
        />
      )}
    </div>
  );
}
