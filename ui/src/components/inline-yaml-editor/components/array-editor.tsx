import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { EditorProps } from "../types";

interface ArrayEditorProps extends EditorProps {
  value: any[];
  updateValue: (value: any[]) => void;
}

export function ArrayEditor({ value, updateValue, previewMode = false }: ArrayEditorProps) {
  const addItem = () => {
    updateValue([...value, ""]);
  };

  const updateItem = (index: number, newValue: string) => {
    const newArray = [...value];
    newArray[index] = newValue;
    updateValue(newArray);
  };

  const removeItem = (index: number) => {
    const newArray = value.filter((_, i) => i !== index);
    updateValue(newArray);
  };

  if (value.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-gray-400 text-sm font-mono">[]</span>
        {!previewMode && (
          <Button
            variant="ghost"
            size="sm"
            onClick={addItem}
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
      {value.map((item, index) => (
        <div key={index} className="flex items-center space-x-2 ml-4">
          <span className="text-gray-400 text-xs">-</span>
          <Input
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={`item ${index + 1}`}
            className="h-5 text-xs p-1 flex-1 max-w-[150px]"
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #404040',
              color: '#22c55e',
            }}
          />
          {!previewMode && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
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
            onClick={addItem}
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