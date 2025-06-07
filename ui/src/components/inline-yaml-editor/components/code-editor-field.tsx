import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit3 } from "lucide-react";
import { CodeEditor } from "@/components/code-editor";

interface CodeEditorFieldProps {
  value: string;
  onChange: (value: string) => void;
  previewMode?: boolean;
}

export function CodeEditorField({ value, onChange, previewMode = false }: CodeEditorFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSave = () => {
    onChange(tempValue);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempValue(value);
    setIsOpen(false);
  };

  const displayValue = value 
    ? value.length > 30 
      ? `${value.substring(0, 30)}...` 
      : value
    : previewMode ? "No code configured" : "Click to edit code";

  if (previewMode) {
    return (
      <div className="relative">
        <div
          className="h-6 text-xs p-1 text-left border rounded cursor-default"
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            color: value ? '#22c55e' : '#6b7280',
            backgroundColor: '#2a2a2a',
            border: '1px solid #404040',
            minWidth: '150px',
          }}
          onMouseEnter={() => value && setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {displayValue}
        </div>
        {showTooltip && value && (
          <div 
            className="absolute z-50 bottom-full left-0 mb-2 p-3 bg-black text-white text-xs rounded shadow-lg max-w-md max-h-48 overflow-auto border"
            style={{ 
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}
          >
            {value}
          </div>
        )}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-6 text-xs p-1 justify-start text-left border"
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            color: value ? '#22c55e' : '#6b7280',
            backgroundColor: '#2a2a2a',
            border: '1px solid #404040',
            minWidth: '150px',
          }}
          onClick={() => {
            setTempValue(value);
            setIsOpen(true);
          }}
        >
          <Edit3 className="h-3 w-3 mr-2" />
          {displayValue}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[60vh]">
        <DialogHeader>
          <DialogTitle>Edit Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-full">
          <div className="flex-1 min-h-0">
            <CodeEditor
              value={tempValue}
              onChange={setTempValue}
              language="bloblang"
              minHeight="300px"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 