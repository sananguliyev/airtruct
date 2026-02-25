import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createFile } from "@/lib/api";

export default function FileNewPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    key: "",
    content: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.key.trim()) {
      addToast({
        id: "validation-error",
        title: "Validation Error",
        description: "File key is required.",
        variant: "error",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createFile({
        key: formData.key.trim(),
        content: formData.content,
      });

      addToast({
        id: "file-created",
        title: "File Created",
        description: `File "${formData.key}" has been created successfully.`,
        variant: "success",
      });
      navigate("/files");
    } catch (error) {
      addToast({
        id: "file-creation-error",
        title: "Error Creating File",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Create New File</h1>
        <p className="text-muted-foreground">
          Create a file that can be referenced by stream components using{" "}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            airtruct://your/file/path
          </code>
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key (path)</Label>
              <Input
                id="key"
                type="text"
                placeholder="e.g., schemas/order.json or scripts/transform.py"
                value={formData.key}
                onChange={(e) =>
                  setFormData({ ...formData, key: e.target.value })
                }
                className="font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">
                Use forward slashes to organize files into directories. Reference
                this file in stream configs as{" "}
                <code className="bg-muted px-1 py-0.5 rounded">
                  airtruct://{formData.key || "your/file/path"}
                </code>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                placeholder="Paste or type your file content here..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="font-mono min-h-[400px]"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/files")}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create File"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
