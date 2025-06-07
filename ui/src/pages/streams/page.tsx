import React, { useEffect, useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Stream } from "@/lib/entities";
import { columns } from "@/components/stream-columns";
import { fetchStreams } from "@/lib/api";

// Replace next/dynamic with React.lazy
const StreamPreview = lazy(
  () => import("@/components/stream-builder/stream-preview")
);

export default function StreamsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [streams, setStreams] = useState<Stream[]>([] as Stream[]);
  const [previewStream, setPreviewStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRowClick = (stream: Stream) => {
    navigate(`/streams/${stream.id}/edit`);
  };

  const handleAddNew = () => {
    navigate("/streams/new");
  };

  const handleDelete = (stream: Stream) => {
    setStreams(streams.filter((s) => s.id !== stream.id));

    addToast({
      id: "stream-deleted",
      title: "Stream Deleted",
      description: `${stream.name} has been deleted successfully.`,
      variant: "success",
    });
  };

  const handlePreview = (stream: Stream) => {
    setPreviewStream(stream);
  };

  useEffect(() => {
    const loadStreams = async () => {
      try {
        setLoading(true);
        const data = await fetchStreams();
        setStreams(data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch streams");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStreams();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Streams</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>

      {loading ? (
        <p>Loading streams...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <DataTable
          data={streams}
          columns={columns()}
          onEdit={handleRowClick}
          onDelete={handleDelete}
          additionalActions={(stream) => (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handlePreview(stream)}
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )}
        />
      )}

      {/* Stream Preview Dialog */}
      <Dialog
        open={!!previewStream}
        onOpenChange={(open: boolean) => !open && setPreviewStream(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{previewStream?.name} - Visual Preview</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Wrap lazy component in Suspense */}
            <Suspense fallback={<div className="flex items-center justify-center h-32">Loading Preview...</div>}>
              {previewStream && <StreamPreview stream={previewStream} />}
            </Suspense>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
