import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { EditorProps } from "../types";

interface KeyValueEditorProps extends EditorProps {
  value: Record<string, any>;
  updateValue: (value: Record<string, any>) => void;
}

export function KeyValueEditor({
  value,
  updateValue,
  previewMode = false,
}: KeyValueEditorProps) {
  const pairs = Object.entries(value);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const addPair = () => {
    updateValue({ ...value, "": "" });
  };

  const updatePairKey = (oldKey: string, newKey: string) => {
    const newObj = { ...value };
    if (oldKey !== newKey) {
      const val = newObj[oldKey] || "";
      delete newObj[oldKey];
      if (newKey.trim()) {
        newObj[newKey] = val;
      }
    }
    updateValue(newObj);
  };

  const updatePairValue = (key: string, newValue: string) => {
    const newObj = { ...value };
    newObj[key] = newValue;
    updateValue(newObj);
  };

  const removePair = (key: string) => {
    const newObj = { ...value };
    delete newObj[key];
    updateValue(newObj);
  };

  if (pairs.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-gray-400 text-sm font-mono">{"{}"}</span>
        {!previewMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={addPair}
            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {pairs.map(([key, val], index) => (
        <div key={index} className="flex items-center space-x-2 ml-4">
          <Input
            value={key}
            onChange={(e) => updatePairKey(key, e.target.value)}
            placeholder="key"
            className={`h-5 text-xs p-1 flex-1 max-w-[80px] bg-background border-border text-foreground 
              font-mono ${isDark ? "text-green-400" : "text-green-600"}`}
            style={{
              fontSize: "11px",
            }}
          />
          <span className="text-muted-foreground text-xs">:</span>
          <Input
            value={val}
            onChange={(e) => updatePairValue(key, e.target.value)}
            placeholder="value"
            className={`h-5 text-xs p-1 flex-1 max-w-[100px] bg-background border-border text-foreground 
              font-mono ${isDark ? "text-green-400" : "text-green-600"}`}
            style={{
              fontSize: "11px",
            }}
          />
          {!previewMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removePair(key)}
              className="h-4 w-4 p-0 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-2 w-2" />
            </Button>
          )}
        </div>
      ))}
      {!previewMode && (
        <div className="ml-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={addPair}
            className="h-5 w-auto px-2 text-green-400 hover:text-green-300 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}
