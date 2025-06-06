import React, { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { CodeEditor } from "@/components/code-editor";
import * as yaml from "js-yaml";

export interface FieldSchema {
  type: "input" | "number" | "bool" | "select" | "code" | "key_value" | "array" | "object";
  title: string;
  description?: string;
  required?: boolean;
  default?: any;
  options?: string[];
  properties?: Record<string, FieldSchema>;
}

export interface ComponentSchema {
  [key: string]: FieldSchema;
}

interface InlineYamlEditorProps {
  schema: ComponentSchema;
  value?: string;
  onChange: (yamlValue: string) => void;
}

interface FieldState {
  enabled: boolean;
  value: any;
}

// Separate component to avoid conditional hook calls
function CodeEditorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);

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
    : "Click to edit code";

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

export function InlineYamlEditor({ schema, value, onChange }: InlineYamlEditorProps) {
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const lastOutputRef = React.useRef<string>('');

  // Check if this is a flat component (has flat: true property)
  const isFlat = (schema as any).flat === true;
  const flatFieldKey = isFlat ? Object.keys(schema).find(key => key !== 'flat') : null;
  const flatFieldSchema = flatFieldKey ? schema[flatFieldKey] : null;

  const getDefaultValue = (fieldSchema: FieldSchema): any => {
    if (fieldSchema.default !== undefined) {
      return fieldSchema.default;
    }
    
    switch (fieldSchema.type) {
      case "input":
        return "";
      case "number":
        return 0;
      case "bool":
        return false;
      case "select":
        return fieldSchema.options?.[0] || "";
      case "code":
        return "";
      case "key_value":
        return {};
      case "array":
        return [];
      case "object":
        return {};
      default:
        return "";
    }
  };

  // Initialize field states from schema and existing YAML value
  useEffect(() => {
    // Skip initialization for flat components
    if (isFlat) return;

    const initialStates: Record<string, FieldState> = {};
    let existingData: any = {};

    // Parse existing YAML value if provided
    if (value && value.trim()) {
      try {
        existingData = yaml.load(value) || {};
      } catch (error) {
        console.warn("Failed to parse existing YAML:", error);
      }
    }

    // Initialize states for each field in schema
    Object.entries(schema).forEach(([fieldKey, fieldSchema]) => {
      const hasExistingValue = existingData.hasOwnProperty(fieldKey);
      const isRequired = fieldSchema.required === true;
      
      initialStates[fieldKey] = {
        enabled: isRequired || hasExistingValue,
        value: hasExistingValue 
          ? existingData[fieldKey] 
          : getDefaultValue(fieldSchema)
      };
    });

    // Only update state if it's actually different
    setFieldStates(prev => {
      const hasChanges = Object.keys(initialStates).some(key => 
        !prev[key] || 
        prev[key].enabled !== initialStates[key].enabled ||
        JSON.stringify(prev[key].value) !== JSON.stringify(initialStates[key].value)
      );
      
      if (hasChanges || Object.keys(prev).length !== Object.keys(initialStates).length) {
        return initialStates;
      }
      
      return prev;
    });
  }, [schema, value, isFlat]);

  // Generate YAML output whenever field states change
  const yamlOutput = useMemo(() => {
    // Skip YAML generation for flat components
    if (isFlat) return value || '';

    const data: any = {};
    
    Object.entries(fieldStates).forEach(([fieldKey, state]) => {
      if (state.enabled && state.value !== undefined) {
        data[fieldKey] = state.value;
      }
    });

    if (Object.keys(data).length === 0) {
      return '';
    }

    try {
      return yaml.dump(data, { 
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        quotingType: '"',
        forceQuotes: false
      });
    } catch (error) {
      console.error("Failed to generate YAML:", error);
      return '';
    }
  }, [fieldStates, isFlat, value]);

  // Update parent whenever YAML output changes, but avoid infinite loops
  useEffect(() => {
    // Skip for flat components as they handle onChange directly
    if (isFlat) return;

    // Skip if this is the same output as last time
    if (lastOutputRef.current === yamlOutput) return;

    // Parse both values to compare the actual data, not just string comparison
    let currentData: any = {};
    let newData: any = {};

    try {
      if (value && value.trim()) {
        currentData = yaml.load(value) || {};
      }
      if (yamlOutput && yamlOutput.trim()) {
        newData = yaml.load(yamlOutput) || {};
      }
    } catch (error) {
      // If there's a parsing error, fall back to string comparison
      if (yamlOutput !== value && lastOutputRef.current !== yamlOutput) {
        lastOutputRef.current = yamlOutput;
        onChange(yamlOutput);
      }
      return;
    }

    // Only call onChange if the actual data is different
    if (JSON.stringify(currentData) !== JSON.stringify(newData)) {
      lastOutputRef.current = yamlOutput;
      onChange(yamlOutput);
    }
  }, [yamlOutput, value, isFlat]);

  const updateFieldState = (fieldKey: string, updates: Partial<FieldState>) => {
    setFieldStates(prev => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], ...updates }
    }));
  };

  // Moved to separate component to avoid conditional hook calls

  const renderKeyValueEditor = (value: Record<string, any>, updateValue: (value: Record<string, any>) => void) => {
    const pairs = Object.entries(value);

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
          <Button
            variant="ghost"
            size="sm"
            onClick={addPair}
            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
          >
            <Plus className="h-3 w-3" />
          </Button>
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
              className="h-5 text-xs p-1 flex-1 max-w-[80px]"
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #404040',
                color: '#22c55e',
              }}
            />
            <span className="text-gray-400 text-xs">:</span>
            <Input
              value={val}
              onChange={(e) => updatePairValue(key, e.target.value)}
              placeholder="value"
              className="h-5 text-xs p-1 flex-1 max-w-[100px]"
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #404040',
                color: '#22c55e',
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removePair(key)}
              className="h-4 w-4 p-0 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-2 w-2" />
            </Button>
          </div>
        ))}
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
      </div>
    );
  };

  const renderArrayEditor = (value: any[], updateValue: (value: any[]) => void) => {
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
          <Button
            variant="ghost"
            size="sm"
            onClick={addItem}
            className="h-5 w-5 p-0 text-green-400 hover:text-green-300"
          >
            <Plus className="h-3 w-3" />
          </Button>
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeItem(index)}
              className="h-4 w-4 p-0 text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-2 w-2" />
            </Button>
          </div>
        ))}
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
      </div>
    );
  };

  const renderObjectEditor = (value: Record<string, any>, updateValue: (value: Record<string, any>) => void, fieldSchema: FieldSchema) => {
    // For objects with defined properties, show nested fields
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

            return (
              <div key={propKey} className="flex items-center space-x-2">
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
                <span 
                  className="text-xs text-gray-400 font-mono min-w-0"
                  style={{ color: isEnabled ? '#9ca3af' : '#6b7280' }}
                >
                  {propKey}:
                </span>
                {isEnabled && (
                  <div className="flex-1 min-w-0">
                    {renderNestedPropertyInput(propKey, propSchema, propValue, (val) => updateNestedValue(propKey, val))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // For free-form objects, use the same key-value editor
    return renderKeyValueEditor(value, updateValue);
  };

  const renderNestedPropertyInput = (propKey: string, propSchema: FieldSchema, propValue: any, updateValue: (value: any) => void) => {
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
          <Input
            value={propValue || ""}
            onChange={(e) => updateValue(e.target.value)}
            className="h-4 text-xs p-1"
            style={inputStyle}
            placeholder="Enter value..."
          />
        );

      case "number":
        return (
          <Input
            type="number"
            value={propValue || 0}
            onChange={(e) => updateValue(Number(e.target.value))}
            className="h-4 text-xs p-1"
            style={inputStyle}
          />
        );

      case "bool":
        return (
          <div className="flex items-center">
            <Switch
              checked={propValue || false}
              onCheckedChange={updateValue}
              className="scale-50"
            />
            <span className="ml-1 text-xs" style={{ color: '#22c55e' }}>
              {propValue ? 'true' : 'false'}
            </span>
          </div>
        );

      case "select":
        return (
          <Select value={propValue || ""} onValueChange={updateValue}>
            <SelectTrigger 
              className="h-4 text-xs w-auto min-w-[60px]"
              style={inputStyle}
            >
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
        return renderArrayEditor(propValue || [], updateValue);

      case "key_value":
        return renderKeyValueEditor(propValue || {}, updateValue);

      case "code":
        return <CodeEditorField value={propValue || ""} onChange={updateValue} />;

      default:
        return (
          <Input
            value={String(propValue || "")}
            onChange={(e) => updateValue(e.target.value)}
            className="h-4 text-xs p-1"
            style={inputStyle}
            placeholder="Enter value..."
          />
        );
    }
  };

  const renderInlineField = (fieldKey: string, fieldSchema: FieldSchema) => {
    const state = fieldStates[fieldKey];
    const isRequired = fieldSchema.required === true;

    if (!state) return null;

    const handleValueChange = (newValue: any) => {
      updateFieldState(fieldKey, { value: newValue });
    };

    const renderValueInput = () => {
      const inputStyle = {
        fontFamily: 'monospace',
        fontSize: '13px',
        color: '#22c55e',
        backgroundColor: '#2a2a2a',
        border: '1px solid #404040',
      };

      const inputClassName = "h-6 text-sm p-1 focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500";

      switch (fieldSchema.type) {
        case "input":
          return (
            <Input
              value={state.value || ""}
              onChange={(e) => handleValueChange(e.target.value)}
              className={inputClassName}
              style={inputStyle}
              placeholder="Enter value..."
            />
          );

        case "number":
          return (
            <Input
              type="number"
              value={state.value || 0}
              onChange={(e) => handleValueChange(Number(e.target.value))}
              className={inputClassName}
              style={inputStyle}
            />
          );

        case "bool":
          return (
            <div className="flex items-center">
              <Switch
                checked={state.value || false}
                onCheckedChange={handleValueChange}
                className="scale-75"
              />
              <span 
                className="ml-2" 
                style={{ 
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: '#22c55e'
                }}
              >
                {state.value ? 'true' : 'false'}
              </span>
            </div>
          );

        case "select":
          return (
            <Select value={state.value || ""} onValueChange={handleValueChange}>
              <SelectTrigger 
                className="h-6 text-sm w-auto min-w-[100px] focus-visible:ring-1 focus-visible:ring-green-500"
                style={{
                  ...inputStyle,
                  color: '#22c55e'
                }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldSchema.options?.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case "code":
          return <CodeEditorField value={state.value || ""} onChange={handleValueChange} />;

        case "key_value":
          return renderKeyValueEditor(state.value || {}, handleValueChange);

        case "array":
          return renderArrayEditor(state.value || [], handleValueChange);

        case "object":
          return renderObjectEditor(state.value || {}, handleValueChange, fieldSchema);

        default:
          return (
            <Input
              value={String(state.value || "")}
              onChange={(e) => handleValueChange(e.target.value)}
              className={inputClassName}
              style={inputStyle}
              placeholder="Enter value..."
            />
          );
      }
    };

    return (
      <div key={fieldKey} className="flex items-center space-x-2 py-1">
        <Checkbox
          checked={state.enabled}
          disabled={isRequired}
          onCheckedChange={(checked) => 
            updateFieldState(fieldKey, { enabled: checked as boolean })
          }
          className="h-4 w-4"
        />
        <span 
          className="min-w-0" 
          style={{ 
            fontFamily: 'monospace',
            fontSize: '13px',
            color: state.enabled ? '#e5e7eb' : '#6b7280'
          }}
        >
          {fieldKey}:
        </span>
        {state.enabled && (
          <div className="flex-1 min-w-0">
            {renderValueInput()}
          </div>
        )}
        {isRequired && (
          <span className="text-red-500 text-xs">*</span>
        )}
      </div>
    );
  };

  // For flat components, render just the code editor directly
  if (isFlat && flatFieldKey && flatFieldSchema) {
    const handleFlatValueChange = (newValue: string) => {
      onChange(newValue);
    };

    return (
      <div 
        className="font-mono text-sm p-4 bg-gray-900 text-gray-100 rounded-md border"
        style={{ 
          backgroundColor: '#1e1e1e',
          border: '1px solid #333',
          lineHeight: '1.5'
        }}
      >
        <div className="space-y-2">
          <span className="text-sm text-gray-400">{flatFieldSchema.title || flatFieldKey}</span>
          {flatFieldSchema.type === "code" ? (
            <CodeEditorField value={value || ""} onChange={handleFlatValueChange} />
          ) : (
            <Input
              value={value || ""}
              onChange={(e) => handleFlatValueChange(e.target.value)}
              className="h-6 text-sm p-1 focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500"
              style={{
                fontFamily: 'monospace',
                fontSize: '13px',
                color: '#22c55e',
                backgroundColor: '#2a2a2a',
                border: '1px solid #404040',
              }}
              placeholder={flatFieldSchema.description}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      className="font-mono text-sm p-4 bg-gray-900 text-gray-100 rounded-md border"
      style={{ 
        backgroundColor: '#1e1e1e',
        border: '1px solid #333',
        lineHeight: '1.5'
      }}
    >
      <div className="space-y-1">
        {Object.entries(schema).map(([fieldKey, fieldSchema]) =>
          renderInlineField(fieldKey, fieldSchema)
        )}
      </div>
    </div>
  );
} 