import React from "react";
// import { Handle, Position, type NodeProps } from "reactflow"; // Handles not used for basic section
import type { NodeProps } from "reactflow";
import { cn } from "@/lib/utils";
import { PlusCircle } from "lucide-react"; // Import PlusCircle icon

export type SectionNodeData = {
  label: string;
  allowedNodeType: "input" | "processor" | "output"; // Corrected type
  onAddNode?: () => void; // Callback to add a node to this section
  isEmpty?: boolean; // Is the section currently empty (for showing add button)
};

const SectionNode = ({
  data,
  // isConnectable, // Not used
  selected,
}: NodeProps<SectionNodeData>) => {
  const { label, onAddNode, isEmpty, allowedNodeType } = data;
  return (
    <div
      className={cn(
        "bg-muted/5 border-2 border-dashed border-slate-400 relative", // Consistent border for all
        // Conditional rounding
        allowedNodeType === 'input' && "rounded-t-lg",
        allowedNodeType === 'processor' && "rounded-none", // No rounding for pipeline
        allowedNodeType === 'output' && "rounded-b-lg",
        // Common styles
        "w-full h-full shadow-sm",
        selected && "ring-2 ring-primary", // This ring is for selection, not the base border
        "flex flex-col items-center justify-center" // Keep content centered for the + button
      )}
      // style={{ minHeight: 200 }} // Min height will be controlled by parent or content
    >
      <div 
        className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 bg-background text-sm font-medium text-slate-500 select-none"
      >
        {label}
      </div>

      {/* Add Node button for empty sections */}
      {isEmpty && onAddNode && (
        <button 
          onClick={onAddNode}
          className="p-2 rounded-full hover:bg-muted text-slate-500 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          title={`Add ${label} node`}
        >
          <PlusCircle className="h-7 w-7" /> {/* Use Lucide icon */}
        </button>
      )}
      {/* Children nodes will be rendered by React Flow within this node's bounds if using parent extent */}
    </div>
  );
};

export default React.memo(SectionNode); 