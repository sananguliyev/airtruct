import { memo } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { X } from "lucide-react";

export const PipelineEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onDelete = data?.onDeleteEdge as ((id: string) => void) | undefined;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: "hsl(var(--muted-foreground))",
          strokeDasharray: "6 3",
          animation: "dashmove 0.5s linear infinite",
        }}
      />
      {onDelete && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className="nodrag nopan"
          >
            <button
              type="button"
              className="flex items-center justify-center w-5 h-5 rounded-full bg-muted border border-border text-muted-foreground shadow-sm hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
              onClick={() => onDelete(id)}
              title="Delete connection"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

PipelineEdge.displayName = "PipelineEdge";
