import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { EditorProps } from "../types";

export interface PropertyItem {
  name: string;
  type: string;
  required?: boolean;
  description?: string;
}

const PROPERTY_TYPES = ["string", "number", "boolean", "array", "object"];

interface PropertyListEditorProps extends EditorProps {
  value: PropertyItem[];
  updateValue: (value: PropertyItem[]) => void;
}

export function PropertyListEditor({
  value,
  updateValue,
  previewMode = false,
}: PropertyListEditorProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const items: PropertyItem[] = Array.isArray(value) ? value : [];

  const addItem = () => {
    updateValue([...items, { name: "", type: "string", required: false, description: "" }]);
  };

  const updateItem = (index: number, field: keyof PropertyItem, newValue: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: newValue };
    updateValue(updated);
  };

  const removeItem = (index: number) => {
    updateValue(items.filter((_, i) => i !== index));
  };

  const inputClassName = `h-6 text-xs p-1 bg-background border-border text-foreground font-mono ${isDark ? "text-green-400" : "text-green-600"}`;

  if (items.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-muted-foreground text-sm font-mono">No parameters</span>
        {!previewMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={addItem}
            className="h-5 w-auto px-2 text-green-400 hover:text-green-300 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add parameter
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-2 p-2 rounded border border-border bg-muted/30"
        >
          <div className="flex-1 grid grid-cols-[1fr_100px] gap-2">
            <Input
              value={item.name}
              onChange={(e) => updateItem(index, "name", e.target.value)}
              placeholder="Parameter name"
              className={inputClassName}
              disabled={previewMode}
            />
            <Select
              value={item.type || "string"}
              onValueChange={(val) => updateItem(index, "type", val)}
              disabled={previewMode}
            >
              <SelectTrigger className={`h-6 text-xs font-mono ${isDark ? "text-green-400" : "text-green-600"}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={item.description || ""}
              onChange={(e) => updateItem(index, "description", e.target.value)}
              placeholder="Description"
              className={`${inputClassName} col-span-2`}
              disabled={previewMode}
            />
            <div className="flex items-center space-x-1.5 col-span-2">
              <Checkbox
                checked={item.required || false}
                onCheckedChange={(checked) => updateItem(index, "required", !!checked)}
                className="h-3.5 w-3.5"
                disabled={previewMode}
              />
              <span className="text-xs text-muted-foreground">Required</span>
            </div>
          </div>
          {!previewMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="h-5 w-5 p-0 text-red-400 hover:text-red-300 mt-0.5"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
      {!previewMode && (
        <Button
          variant="ghost"
          size="sm"
          onClick={addItem}
          className="h-5 w-auto px-2 text-green-400 hover:text-green-300 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add parameter
        </Button>
      )}
    </div>
  );
}
