import type React from "react";
import { useCallback, useState, useRef, useEffect, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Save, Trash2, PlusCircle } from "lucide-react"; 

// Define types locally since the files were deleted
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

import { 
  NodeConfigPanel, 
  type AllComponentSchemas 
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/toast";
import * as yaml from "js-yaml";

// --- Custom Types Definition ---
type NodeType = "input" | "processor" | "output";

export interface CustomNode {
  id: string;
  type: NodeType;
  parentId: string; // id of the section it belongs to
  data: StreamNodeData;
}

export interface CustomSection {
  id: string;
  type: NodeType; // Corresponds to the type of nodes it can contain
  label: string;
  nodes: CustomNode[]; // Nodes belonging to this section
  data: SectionNodeData;
}
// --- End Custom Types Definition ---

// Constants for layout (can be adjusted)
// const sectionWidth = "480px"; // Using string for CSS - Removed, now dynamic
const defaultSectionMinHeight = "150px"; // Changed to minHeight
const pipelineNodeSpacing = 30; // Increased spacing for plus buttons
const streamNodeCardMinHeight = 60; // Min height for a card
const pipelineInternalPaddingY = 30;
const sectionVerticalSpacing = 30; // Space between Input/Pipeline/Output sections

// Removed old width constants: sectionMaxWidth, cardMaxWidth, cardMinWidth as they are redefined or context-dependent

interface StreamBuilderProps {
  allComponentSchemas: AllComponentSchemas;
  initialData?: {
    name: string;
    status: string;
    // initialData.nodes will now be our CustomNodeDataType array
    nodes: StreamNodeData[]; 
    // Edges are implicit in order for now, or can be rebuilt if source/target provided
  };
  onSave: (data: {
    name: string;
    status: string;
    nodes: StreamNodeData[]; // Save will be an array of node data objects
  }) => void;
}

// Component-specific constants for sizing, defined inside StreamBuilderContent or passed if needed.
// For NodeCard, CARD_MAX_WIDTH_STREAM_PANEL and CARD_MIN_WIDTH_STREAM_PANEL will be used from parent.

const NodeCard: React.FC<{ 
  node: CustomNode; 
  onClick: () => void; 
  selected: boolean; 
  onDelete: () => void; 
  onAddBelow?: () => void; 
  onAddAbove?: () => void; 
  isFirstInPipeline?: boolean; 
  isPipeline?: boolean;
  cardMaxWidth: string; // Pass dynamic max width
  cardMinWidth: string; // Pass dynamic min width
}> = ({ node, onClick, selected, onDelete, onAddBelow, onAddAbove, isFirstInPipeline, isPipeline, cardMaxWidth, cardMinWidth }) => {
  const showTopPlus = isPipeline && onAddAbove && isFirstInPipeline;
  const showBottomPlus = isPipeline && onAddBelow;

  return (
    <div className="flex flex-col items-center w-full relative">
      {showTopPlus && (
        <div className="flex justify-center items-center w-full py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {e.stopPropagation(); onAddAbove();}}
            className="text-muted-foreground hover:text-primary z-10 p-1"
            title="Add node above"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
      )}
      <Card 
        className={`w-full mx-auto shadow-md cursor-pointer ${selected ? "ring-2 ring-primary" : "hover:shadow-lg"}`}
        style={{ 
          minHeight: `${streamNodeCardMinHeight}px`,
          maxWidth: cardMaxWidth, 
          minWidth: cardMinWidth 
        }}
        onClick={onClick}
      >
        <CardHeader className="p-3 pb-1 flex-row justify-between items-center">
          <CardTitle className="text-sm font-medium truncate">{node.data.label}</CardTitle>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete();}} className="h-6 w-6">
            <Trash2 className="h-4 w-4 text-destructive"/>
          </Button>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <p className="text-xs text-muted-foreground break-all">
            {node.data.component ? `${node.data.component}` : (node.data.componentId ? `ID: ${node.data.componentId}` : '')}
          </p>
        </CardContent>
      </Card>
      {showBottomPlus && (
        <div className="flex justify-center items-center w-full py-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {e.stopPropagation(); onAddBelow();}}
            className="text-muted-foreground hover:text-primary z-10 p-1"
            title="Add node below"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
};

function StreamBuilderContent({
  allComponentSchemas,
  initialData,
  onSave,
}: StreamBuilderProps) {
  const { addToast } = useToast();

  // Sizing constants for panels and cards within the stream (right) panel
  const CARD_MAX_WIDTH_STREAM_PANEL = "500px"; // Max width for cards in the stream panel
  const CARD_MIN_WIDTH_STREAM_PANEL = "240px"; // Min width for cards in the stream panel

  const [name, setName] = useState(initialData?.name || "");
  const [status, setStatus] = useState(initialData?.status || "active");
  const [nodes, setNodes] = useState<CustomNode[]>(() => {
    if (initialData?.nodes) {
      return initialData.nodes.map(nd => {
        let parentId = "";
        if (nd.type === 'input') parentId = 'input-section';
        else if (nd.type === 'output') parentId = 'output-section';
        else parentId = 'pipeline-section'; // Default for processor
        return { id: uuidv4(), type: nd.type, parentId, data: {...nd} }; // ensure data is a new object
      });
    }
    return [];
  });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const inputNodes = useMemo(() => nodes.filter(n => n.parentId === 'input-section'), [nodes]);
  const pipelineNodes = useMemo(() => nodes.filter(n => n.parentId === 'pipeline-section'), [nodes]); // Order might need to be managed if not by add order
  const outputNodes = useMemo(() => nodes.filter(n => n.parentId === 'output-section'), [nodes]);

  const getNextProcessorLabel = useCallback(() => {
    const processorCount = nodes.filter(n => n.type === 'processor').length;
    return `new_processor_${processorCount + 1}`;
  }, [nodes]);

  const handleAddNode = useCallback((sectionType: NodeType, siblingNodeId?: string, direction?: "above" | "below") => {
    if (sectionType === 'input' && inputNodes.length > 0) {
      addToast({ id: "input-exists-toast", title: "Input Node Exists", description: "Only one input node is allowed.", variant: "info" });
      return;
    }
    if (sectionType === 'output' && outputNodes.length > 0) {
      addToast({ id: "output-exists-toast", title: "Output Node Exists", description: "Only one output node is allowed.", variant: "info" });
      return;
    }

    let label = `new_${sectionType}`;
    if (sectionType === 'processor') label = getNextProcessorLabel();
    
    const newNodeData: StreamNodeData = { label, type: sectionType, componentId: "" };
    // Corrected parentId to match section IDs for processors
    const parentId = sectionType === 'processor' ? 'pipeline-section' : `${sectionType}-section`;
    const newNode: CustomNode = { id: uuidv4(), type: sectionType, parentId, data: newNodeData };

    // Auto-select the newly created node
    setSelectedNodeId(newNode.id);

    setNodes(prevNodes => {
      if (parentId === 'pipeline-section') {
          const pipelineOnlyNodes = prevNodes.filter(n => n.parentId === 'pipeline-section');
          const nonPipelineNodes = prevNodes.filter(n => n.parentId !== 'pipeline-section');
          let insertAtIndex = pipelineOnlyNodes.length; // Default to end of pipeline

          if (siblingNodeId && direction) {
            const siblingIdx = pipelineOnlyNodes.findIndex(n => n.id === siblingNodeId);
            if (siblingIdx !== -1) {
              insertAtIndex = direction === 'above' ? siblingIdx : siblingIdx + 1;
            }
          }
          const newPipelineNodes = [...pipelineOnlyNodes];
          newPipelineNodes.splice(insertAtIndex, 0, newNode);
          return [...nonPipelineNodes, ...newPipelineNodes];
      } else {
          return [...prevNodes, newNode];
      }
    });
  }, [nodes, inputNodes.length, outputNodes.length, addToast, getNextProcessorLabel]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(prevNodes => prevNodes.filter(n => n.id !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  }, [selectedNodeId]);

  const handleUpdateNode = useCallback((nodeId: string, data: StreamNodeData) => {
    setNodes(prevNodes => prevNodes.map(n => n.id === nodeId ? { ...n, data: {...data} } : n));
  }, []);

  const selectedNodeDetails = useMemo(() => nodes.find(n => n.id === selectedNodeId), [nodes, selectedNodeId]);
  
  // Calculate Pipeline section height - simplified approach
  const pipelineSectionHeight = useMemo(() => {
    const numPipelineNodes = pipelineNodes.length;
    if (numPipelineNodes === 0) {
      return defaultSectionMinHeight;
    }
    
    // Simple calculation: just let it grow naturally, no fixed height
    return 'auto';
  }, [pipelineNodes.length]);

  const renderSection = (type: NodeType, labelText: string, specificNodes: CustomNode[], fixedHeight?: string) => {
    const sectionId = type === 'processor' ? 'pipeline-section' : `${type}-section`;
    const currentMinHeight = type === 'processor' ? defaultSectionMinHeight : (fixedHeight || defaultSectionMinHeight);
    
    // For pipeline, only show top plus if list is empty
    const showTopPlusForEmptyPipeline = type === 'processor' && specificNodes.length === 0;

    return (
      <div 
        className="border-2 border-dashed border-slate-400 rounded-md p-4 flex flex-col items-center relative w-full"
        style={{ minHeight: currentMinHeight }}
      >
        <div className="absolute -top-3.5 bg-background px-2 text-slate-500 text-sm font-medium">{labelText}</div>
        
        {specificNodes.length === 0 && type !== 'processor' && (
          <Button variant="ghost" size="icon" onClick={() => handleAddNode(type)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <PlusCircle className="h-8 w-8 text-muted-foreground" />
          </Button>
        )}

        {showTopPlusForEmptyPipeline && (
            <Button variant="ghost" size="icon" onClick={() => handleAddNode('processor')} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <PlusCircle className="h-8 w-8 text-muted-foreground" />
            </Button>
        )}

        <div className="flex flex-col items-center w-full gap-1">
          {specificNodes.map((node, index) => (
              <NodeCard 
                key={node.id} 
                node={node} 
                onClick={() => setSelectedNodeId(node.id)} 
                selected={selectedNodeId === node.id}
                onDelete={() => handleDeleteNode(node.id)}
                isPipeline={type === 'processor'}
                isFirstInPipeline={type === 'processor' && index === 0}
                onAddAbove={type === 'processor' ? () => handleAddNode('processor', node.id, 'above') : undefined}
                onAddBelow={type === 'processor' ? () => handleAddNode('processor', node.id, 'below') : undefined}
                cardMaxWidth={CARD_MAX_WIDTH_STREAM_PANEL}
                cardMinWidth={CARD_MIN_WIDTH_STREAM_PANEL}
              />
            ))}
        </div>
      </div>
    );
  };

  const validateRequiredFields = useCallback((node: CustomNode): { isValid: boolean; missingFields: string[]; error?: string } => {
    if (!node.data.componentId) {
      return { isValid: false, missingFields: ['component selection'] };
    }

    const component = allComponentSchemas[node.type]?.find(c => c.id === node.data.componentId);
    const schema = component?.schema || {};
    const properties = schema.properties || {};
    
    // If component has no fields (like sync_response), it's valid
    if (Object.keys(properties).length === 0) {
      return { isValid: true, missingFields: [] };
    }

    // Parse the YAML config to check required fields
    let configData: any = {};
    if (node.data.configYaml && node.data.configYaml.trim()) {
      try {
        configData = yaml.load(node.data.configYaml) || {};
      } catch (error) {
        return { isValid: false, missingFields: [], error: 'Invalid YAML format' };
      }
    }

    // Check required fields
    const missingFields: string[] = [];
    
    // For flat components, check if there's any content in the YAML
    if (schema.flat === true) {
      // For flat components, if there's any valid YAML content, consider required fields satisfied
      const hasContent = Object.keys(configData).length > 0 || 
                        (Array.isArray(configData) && configData.length > 0) ||
                        (typeof configData === 'string' && configData.trim().length > 0);
      
      if (!hasContent) {
        // Find the first required field to report as missing
        Object.entries(properties).forEach(([fieldKey, fieldSchema]) => {
          if ((fieldSchema as any).required === true && missingFields.length === 0) {
            missingFields.push(fieldKey);
          }
        });
      }
    } else {
      // For non-flat components, check each required field individually
      Object.entries(properties).forEach(([fieldKey, fieldSchema]) => {
        if ((fieldSchema as any).required === true) {
          const value = configData[fieldKey];
          if (value === undefined || value === null || value === '') {
            missingFields.push(fieldKey);
          }
        }
      });
    }

    return { isValid: missingFields.length === 0, missingFields };
  }, [allComponentSchemas]);

  const handleSave = useCallback(() => {
    const nodesToSave = nodes.map(n => n.data);
    const inputNode = nodes.find(n => n.type === 'input');
    const outputNode = nodes.find(n => n.type === 'output');
    const processorNodes = nodes.filter(n => n.type === 'processor');

    // Basic validation
    if (!name.trim()) { 
      addToast({id: "name-req-toast", title: "Validation Error", description: "Stream Name is mandatory.", variant: "warning"}); 
      return; 
    }
    if (!inputNode) { 
      addToast({id: "input-req-toast", title: "Validation Error", description: "An Input node is mandatory.", variant: "warning" }); 
      return; 
    }
    if (!outputNode) { 
      addToast({id: "output-req-toast", title: "Validation Error", description: "An Output node is mandatory.", variant: "warning" }); 
      return; 
    }

    // Validate input node required fields
    const inputValidation = validateRequiredFields(inputNode);
    if (!inputValidation.isValid) {
      const errorMessage = inputValidation.error || 
        `Missing required fields: ${inputValidation.missingFields.join(', ')}`;
      addToast({
        id: "input-validation-toast", 
        title: "Input Validation Error", 
        description: `Input node - ${errorMessage}`, 
        variant: "warning"
      });
      return;
    }

    // Validate output node required fields
    const outputValidation = validateRequiredFields(outputNode);
    if (!outputValidation.isValid) {
      const errorMessage = outputValidation.error || 
        `Missing required fields: ${outputValidation.missingFields.join(', ')}`;
      addToast({
        id: "output-validation-toast", 
        title: "Output Validation Error", 
        description: `Output node - ${errorMessage}`, 
        variant: "warning"
      });
      return;
    }

    // Validate processor nodes required fields
    for (const processorNode of processorNodes) {
      const processorValidation = validateRequiredFields(processorNode);
      if (!processorValidation.isValid) {
        const errorMessage = processorValidation.error || 
          `Missing required fields: ${processorValidation.missingFields.join(', ')}`;
        addToast({
          id: "processor-validation-toast", 
          title: "Processor Validation Error", 
          description: `"${processorNode.data.label}" - ${errorMessage}`, 
          variant: "warning"
        });
        return;
      }
    }

    onSave({ name, status, nodes: nodesToSave });
  }, [name, status, nodes, onSave, addToast, validateRequiredFields]);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full">
      <div className="flex space-x-4 mb-4">
        <div className="flex-1">
          <Label htmlFor="stream-name">Stream Name</Label>
          <Input id="stream-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter stream name" className="mb-2" />
        </div>
        <div className="w-48">
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
      </div>

      <div className="flex flex-1 gap-4 mt-4 w-full h-full">
        {/* Left Panel (Config) */}
        <div className="flex-[7] flex flex-col h-full min-w-0">
          <div className="flex flex-col h-full">
            {selectedNodeDetails ? (
              <NodeConfigPanel 
                key={selectedNodeDetails.id} 
                allComponentSchemas={allComponentSchemas}
                selectedNode={{ 
                  id: selectedNodeDetails.id, 
                  data: selectedNodeDetails.data, 
                  type: selectedNodeDetails.type, 
                  position: {x:0, y:0}, 
                  measured: { width: 0, height: 0}, 
                  selected: true, 
                  dragging: false,
                  resizing: false,
                } as any} 
                onUpdateNode={handleUpdateNode} 
                onDeleteNode={handleDeleteNode} 
              />
            ) : (
              <Card className="w-full h-full flex flex-col"><CardHeader><CardTitle>Stream Builder</CardTitle></CardHeader><CardContent className="flex-1"><p className="text-muted-foreground">Select a node to configure it.</p></CardContent></Card>
            )}
          </div>
        </div>

        {/* Right Panel (Stream) */}
        <div className="flex-[3] flex flex-col h-full border rounded-md bg-background relative min-w-0">
          <div className="p-4 pt-8 overflow-y-auto h-full">
            <div className="flex flex-col items-center gap-6 min-h-full">
              {renderSection('input', 'Input', inputNodes)}
              {renderSection('processor', 'Pipeline', pipelineNodes)}
              {renderSection('output', 'Output', outputNodes)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} disabled={!name.trim() || !nodes.some(n=>n.type ==='input') || !nodes.some(n=>n.type ==='output')} className="flex items-center gap-1">
          <Save className="h-4 w-4" /> Save Stream
        </Button>
      </div>
    </div>
  );
}

// Main export
export function StreamBuilder(props: StreamBuilderProps) {
  return <StreamBuilderContent {...props} />;
}
