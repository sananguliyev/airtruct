import React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { EditorProps, FieldSchema } from "../types";
import { getDefaultValue } from "../utils/defaults";
import { KeyValueEditor } from "./key-value-editor";
import { NestedPropertyInput } from "./nested-property-input";

interface ObjectEditorProps extends EditorProps {
  value: Record<string, any>;
  updateValue: (value: Record<string, any>) => void;
  fieldSchema: FieldSchema;
}

export function ObjectEditor({ 
  value, 
  updateValue, 
  fieldSchema, 
  previewMode = false 
}: ObjectEditorProps) {
  if (fieldSchema.properties) {
    const updateNestedValue = (propKey: string, propValue: any) => {
      const newValue = { ...value, [propKey]: propValue };
      updateValue(newValue);
    };

    return (
      <div className="space-y-1 ml-4 border-l border-gray-600 pl-2">
        {Object.entries(fieldSchema.properties).map(([propKey, propSchema]) => {
          const propValue = value[propKey] ?? getDefaultValue(propSchema);
          const isEnabled = value.hasOwnProperty(propKey);

          // In preview mode, hide non-enabled nested properties
          if (previewMode && !isEnabled) return null;

          return (
            <div key={propKey} className="flex items-center space-x-2">
              {!previewMode && (
                <Checkbox
                  checked={isEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      updateNestedValue(propKey, getDefaultValue(propSchema));
                    } else {
                      const newValue = { ...value };
                      delete newValue[propKey];
                      updateValue(newValue);
                    }
                  }}
                  className="h-3 w-3"
                />
              )}
              <span 
                className="text-xs text-gray-400 font-mono min-w-0"
                style={{ color: isEnabled ? '#9ca3af' : '#6b7280' }}
              >
                {propKey}:
              </span>
              {isEnabled && (
                <div className="flex-1 min-w-0">
                  <NestedPropertyInput
                    propKey={propKey}
                    propSchema={propSchema}
                    propValue={propValue}
                    updateValue={(val: any) => updateNestedValue(propKey, val)}
                    previewMode={previewMode}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return <KeyValueEditor value={value} updateValue={updateValue} previewMode={previewMode} />;
} 