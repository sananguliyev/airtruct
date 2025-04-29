import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/button";
import { DataTable } from "../../components/dataTable";
import { Plus, Eye } from "lucide-react";
import { Badge } from "../../ui/badge";
import { useToast } from "../../components/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../ui/dialog";
import { Stream } from "../../lib/entities";
import StreamPreview from "../../components/stream-builder/stream-preview";


export default function StreamsPage() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [streams, setStreams] = useState<Stream[]>([]);
    const [previewStream, setPreviewStream] = useState<Stream | null>(null);
  
    const columns = [
      { key: "name" as keyof Stream, title: "Name" },
      {
        key: "status" as keyof Stream,
        title: "Status",
        render: (value: string) => {
          const colorMap: Record<string, string> = {
            active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
            finished: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
            paused: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
            error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
          };
          return (
            <Badge className={colorMap[value] || ""} variant="outline">
              {value}
            </Badge>
          );
        },
      },
      { key: "inputLabel" as keyof Stream, title: "Input" },
      { key: "outputLabel" as keyof Stream, title: "Output" },
      {
        key: "createdAt" as keyof Stream,
        title: "Last versioned at",
        render: (value: string) => (value ? value : "-"),
      },
      {
        key: "preview",
        title: "Preview",
        render: (_: any, row: Stream) => (
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setPreviewStream(row)}
            title="Preview"
          >
            <Eye className="w-4 h-4" />
          </Button>
        ),
      },
    ];
  
    useEffect(() => {
      async function fetchStreams() {
        try {
          const response = await fetch("http://localhost:8080/streams");
          if (!response.ok) throw new Error("Response not ok");
          const data = await response.json();
          setStreams(
            data.map((stream: any) => ({
              id: stream.id,
              name: stream.name,
              status: stream.status,
              input: stream.input,
              inputID: stream.input_id,
              inputLabel: stream.input_label,
              processors: stream.processors.map((processor: any) => ({
                processorID: processor.processor_id,
                label: processor.label,
                createdAt: new Date(processor.created_at).toLocaleString(),
              })),
              output: stream.output,
              outputID: stream.output_id,
              outputLabel: stream.output_label,
              createdAt: new Date(stream.created_at).toLocaleString(),
            }))
          );
        } catch (error) {
          console.error("Error fetching streams data:", error);
        }
      }
      fetchStreams();
    }, []);
  
    const handleAddNew = () => navigate("/streams/new");
    const handleEdit = (stream: Stream) => navigate(`/streams/${stream.id}/edit`);
    const handleDelete = (stream: Stream) => {
      setStreams(streams.filter((s) => s.id !== stream.id));
      addToast({
        id: "stream-deleted",
        title: "Stream Deleted",
        description: `${stream.name} has been deleted successfully.`,
        variant: "success",
      });
    };
  
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Streams</h1>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </div>
        <DataTable
          data={streams}
          columns={columns}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        {/* Stream Preview Dialog */}
        <Dialog open={!!previewStream} onOpenChange={open => !open && setPreviewStream(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {previewStream?.name} - Visual Preview
              </DialogTitle>
            </DialogHeader>
            {previewStream && <StreamPreview stream={previewStream} />}
          </DialogContent>
        </Dialog>
      </div>
    );
  }