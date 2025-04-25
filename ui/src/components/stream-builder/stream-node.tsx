import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge-variants";

export type StreamNodeData = {
  label: string;
  type: "input" | "processor" | "output";
  component?: string;
  componentId?: string;
  status?: string;
};

const StreamNode = ({ data, selected }: NodeProps<StreamNodeData>) => {
  const { label, type, component, status } = data;

  return (
    <Card className={`w-64 shadow-md ${selected ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="p-3 pb-0">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          {status && (
            <Badge
              variant={
                status === "Active"
                  ? "success"
                  : status === "Paused"
                  ? "warning"
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

      {/* Handles for connecting nodes */}
      {type !== "input" && (
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-primary border-2 border-background"
        />
      )}
      {type !== "output" && (
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-primary border-2 border-background"
        />
      )}
    </Card>
  );
};

export default memo(StreamNode);
