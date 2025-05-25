import { memo } from "react";
import { type NodeProps } from "reactflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge-variants";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export type StreamNodeData = {
  label: string;
  type: "input" | "processor" | "output";
  component?: string; // This will now store the name of the base component, e.g., "Kafka Reader"
  componentId?: string; // This will store the ID of the selected base component for schema validation
  configYaml?: string; // New field for the YAML configuration
  status?: string;
  isPipeline?: boolean;
  isFirstInPipeline?: boolean;
  isLastInPipeline?: boolean;
  onAddNode?: (direction: "top" | "bottom") => void;
};

const StreamNode = ({ data, selected }: NodeProps<StreamNodeData>) => {
  const { label, type, component, status, isPipeline, isFirstInPipeline, isLastInPipeline, onAddNode } = data;
  const estimatedCardHeight = 70; // Approximate height of the card content in pixels
  const pipelineNodeSpacing = 120; // Must match the one in stream-builder.tsx
  const buttonHeight = 24; // h-6 in Tailwind, which is 1.5rem or 24px

  // Calculate top offset for the "add below" button to center it in the gap
  const addBelowButtonTopOffset = estimatedCardHeight + (pipelineNodeSpacing - estimatedCardHeight - buttonHeight) / 2;

  return (
    <div className="relative flex flex-col items-center">
      {isPipeline && onAddNode && isFirstInPipeline && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAddNode("top")}
          className="absolute -top-8 left-1/2 -translate-x-1/2 text-muted-foreground hover:text-primary z-10"
          title="Add node above"
        >
          <PlusCircle className="h-6 w-6" />
        </Button>
      )}

      <Card className={`w-[400px] shadow-md ${selected ? "ring-2 ring-primary" : ""}`}>
        <CardHeader className="p-3 pb-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm font-medium">{label}</CardTitle>
            {status && (
              <Badge
                variant={
                  status === "active"
                    ? "info"
                    : status === "paused"
                    ? "warning"
                    : status === "completed"
                    ? "success"
                    : "secondary"
                }
                className="text-xs"
              >
                {status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-1">
          <div className="text-xs text-muted-foreground">
            {component && <p className="truncate">{component}</p>}
            <Badge variant="outline" className="mt-2 text-primary-foreground">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {isPipeline && onAddNode && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onAddNode("bottom")}
          className={`absolute left-1/2 -translate-x-1/2 text-muted-foreground hover:text-primary z-10`}
          style={{ top: `${addBelowButtonTopOffset}px` }}
          title="Add node below"
        >
          <PlusCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};

export default memo(StreamNode);
