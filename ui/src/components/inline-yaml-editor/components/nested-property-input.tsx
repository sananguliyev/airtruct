import React from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldSchema } from "../types";
import { TextInputField } from "./text-input-field";
import { LazyCodeEditorField, LazyArrayEditor } from "./lazy-components";
import { Suspense } from "react";
import { KeyValueEditor } from "./key-value-editor";

interface NestedPropertyInputProps {
  propKey: string;
  propSchema: FieldSchema;
  propValue: any;
  updateValue: (value: any) => void;
  previewMode?: boolean;
}

export function NestedPropertyInput({ 
  propKey, 
  propSchema, 
  propValue, 
  updateValue, 
  previewMode = false 
}: NestedPropertyInputProps) {
  const inputStyle = {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#22c55e',
    backgroundColor: '#2a2a2a',
    border: '1px solid #404040',
  };

  switch (propSchema.type) {
    case "input":
      return (
        <TextInputField
          value={propValue || ""}
          onChange={updateValue}
          previewMode={previewMode}
          placeholder={propSchema.description}
        />
      );

    case "number":
      return (
        <Input
          type="number"
          value={propValue || 0}
          onChange={(e) => updateValue(Number(e.target.value))}
          className="h-5 text-xs p-1"
          style={inputStyle}
          disabled={previewMode}
        />
      );

    case "bool":
      return (
        <div className="flex items-center">
          <Switch
            checked={propValue || false}
            onCheckedChange={updateValue}
            className="scale-50"
            disabled={previewMode}
          />
          <span style={{ ...inputStyle, marginLeft: '4px' }}>
            {propValue ? 'true' : 'false'}
          </span>
        </div>
      );

    case "select":
      return (
        <Select value={propValue || ""} onValueChange={updateValue} disabled={previewMode}>
          <SelectTrigger className="h-5 text-xs w-auto min-w-[80px]" style={inputStyle}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {propSchema.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "array":
      return (
        <Suspense fallback={<div className="text-xs text-gray-400">Loading...</div>}>
          <LazyArrayEditor value={propValue || []} updateValue={updateValue} previewMode={previewMode} />
        </Suspense>
      );

    case "key_value":
      return <KeyValueEditor value={propValue || {}} updateValue={updateValue} previewMode={previewMode} />;

    case "code":
      return (
        <Suspense fallback={<div className="text-xs text-gray-400">Loading...</div>}>
          <LazyCodeEditorField 
            value={propValue || ""} 
            onChange={updateValue} 
            previewMode={previewMode} 
          />
        </Suspense>
      );

    default:
      return (
        <TextInputField
          value={String(propValue || "")}
          onChange={updateValue}
          previewMode={previewMode}
          placeholder={propSchema.description}
        />
      );
  }
} 