import React, { useEffect, useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Plus, Eye, Play, Pause, RotateCcw, ScrollText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Flow } from "@/lib/entities";
import { columns } from "@/components/flow-columns";
import { fetchFlows, updateFlowStatus } from "@/lib/api";

const FlowPreview = lazy(
  () => import("@/components/flow-builder/flow-preview"),
);

export default function FlowsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [flows, setFlows] = useState<Flow[]>([] as Flow[]);
  const [previewFlow, setPreviewFlow] = useState<Flow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRowClick = (flow: Flow) => {
    navigate(`/flows/${flow.id}/edit`);
  };

  const handleAddNew = () => {
    navigate("/flows/new");
  };

  const handleDelete = (flow: Flow) => {
    setFlows(flows.filter((s) => s.id !== flow.id));

    addToast({
      id: "flow-deleted",
      title: "Flow Deleted",
      description: `${flow.name} has been deleted successfully.`,
      variant: "success",
    });
  };

  const handlePreview = (flow: Flow) => {
    setPreviewFlow(flow);
  };

  const handleStatusUpdate = async (flow: Flow, newStatus: string) => {
    if (newStatus === "active" && !flow.is_ready) {
      addToast({
        id: "flow-not-ready",
        title: "Cannot start flow",
        description: `${flow.name} is a draft. Open the flow builder and complete the configuration before starting.`,
        variant: "error",
      });
      return;
    }

    try {
      const updatedFlow = await updateFlowStatus(flow.id, newStatus);

      setFlows(flows.map((s) => (s.id === flow.id ? updatedFlow : s)));

      addToast({
        id: "flow-status-updated",
        title: "Status Updated",
        description: `${flow.name} status has been updated to ${newStatus}.`,
        variant: "success",
      });
    } catch (error) {
      addToast({
        id: "flow-status-error",
        title: "Failed to update flow status",
        description:
          error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "error",
      });
    }
  };

  useEffect(() => {
    const loadFlows = async () => {
      try {
        setLoading(true);
        const data = await fetchFlows();
        setFlows(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch flows");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadFlows();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Flows</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>

      {loading ? (
        <p>Loading flows...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <DataTable
          data={flows}
          columns={columns()}
          onEdit={handleRowClick}
          onDelete={handleDelete}
          additionalActions={(flow) => (
            <>
              {/* Quick action buttons based on status */}
              {flow.status === "active" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusUpdate(flow, "paused")}
                  title="Pause Flow"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              {flow.status === "paused" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusUpdate(flow, "active")}
                  title="Resume Flow"
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {flow.status === "completed" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleStatusUpdate(flow, "active")}
                  title="Restart Flow"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  navigate(`/flows/${flow.parentID || flow.id}/events`)
                }
                title="Events"
              >
                <ScrollText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handlePreview(flow)}
                title="Preview"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </>
          )}
        />
      )}

      {/* Flow Preview Dialog */}
      <Dialog
        open={!!previewFlow}
        onOpenChange={(open: boolean) => !open && setPreviewFlow(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{previewFlow?.name} - Visual Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Wrap lazy component in Suspense */}
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-32">
                  Loading Preview...
                </div>
              }
            >
              {previewFlow && <FlowPreview flow={previewFlow} />}
            </Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
