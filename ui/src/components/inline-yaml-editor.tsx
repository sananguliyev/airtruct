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
  type: "input" | "number" | "bool" | "select" | "code" | "key_value" | "array" | "object" | "processor_list" | "output_cases" | "output_list" | "input_list" | "processor_cases";
  title: string;
  description?: string;
  required?: boolean;
  default?: any;
  options?: string[];
  properties?: Record<string, FieldSchema>;
}

export interface ComponentSchema {
  title?: string;
  flat?: boolean;
  properties?: Record<string, FieldSchema>;
  [key: string]: any;
}

export interface ProcessorComponentSchema {
  id: string;
  name: string;
  component: string;
  type: "input" | "processor" | "output";
  schema?: ComponentSchema;
}

interface InlineYamlEditorProps {
  schema: ComponentSchema;
  value?: string;
  onChange: (yamlValue: string) => void;
  availableProcessors?: ProcessorComponentSchema[];
  availableInputs?: ProcessorComponentSchema[];
  availableOutputs?: ProcessorComponentSchema[];
}

interface FieldState {
  enabled: boolean;
  value: any;
}


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

export function InlineYamlEditor({ schema, value, onChange, availableProcessors = [], availableInputs = [], availableOutputs = [] }: InlineYamlEditorProps) {
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>({});
  const lastOutputRef = React.useRef<string>('');
  

  const isFlat = schema.flat === true;
  const actualSchema = schema.properties || {};
  const flatFieldKey = isFlat ? Object.keys(actualSchema)[0] : null;
  const flatFieldSchema = flatFieldKey ? actualSchema[flatFieldKey] : null;
  

  const [internalProcessors, setInternalProcessors] = useState<any[]>([]);
  const [internalInputs, setInternalInputs] = useState<any[]>([]);
  const [internalOutputs, setInternalOutputs] = useState<any[]>([]);
  const [internalOutputCases, setInternalOutputCases] = useState<any[]>([]);
  const [internalProcessorCases, setInternalProcessorCases] = useState<any[]>([]);
  const isInternalUpdateRef = React.useRef(false);

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
      case "processor_list":
        return [];
      case "output_cases":
        return [];
      case "output_list":
        return [];
      case "input_list":
        return [];
      case "processor_cases":
        return [];
      default:
        return "";
    }
  };


  useEffect(() => {

    if (isFlat) return;

    const initialStates: Record<string, FieldState> = {};
    let existingData: any = {};


    if (value && value.trim()) {
      try {
        existingData = yaml.load(value) || {};
      } catch (error) {
        console.warn("Failed to parse existing YAML:", error);
      }
    }

    // Initialize states for each field in schema
    Object.entries(actualSchema).forEach(([fieldKey, fieldSchema]) => {
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
  }, [actualSchema, value, isFlat]);


  const yamlOutput = useMemo(() => {

    if (isFlat) return value || '';

    const data: any = {};
    
    Object.entries(fieldStates).forEach(([fieldKey, state]) => {
      if (state.enabled && state.value !== undefined) {
        const fieldSchema = actualSchema[fieldKey];
        
        if (fieldSchema?.type === "output_cases") {
          // Convert output cases to proper YAML format - use internal state if available
          const sourceValue = internalOutputCases.length > 0 ? internalOutputCases : state.value;
          const validCases = sourceValue
            .filter((caseItem: any) => caseItem.check || (caseItem.output?.componentId && caseItem.output?.component))
            .map((caseItem: any) => {
              const output = caseItem.output;
              
              const result: any = {
                check: caseItem.check || ""
              };
              
              if (output?.componentId && output?.component) {
                const outputObj: any = { [output.component]: {} };
                if (output.configYaml && output.configYaml.trim()) {
                  try {
                    outputObj[output.component] = yaml.load(output.configYaml) || {};
                  } catch (error) {
                    console.warn("Failed to parse output config YAML:", error);
                  }
                }
                result.output = outputObj;
              }
              
              if (caseItem.continue) {
                result.continue = true;
              }
              
              return result;
            });
          
          // Always include the field if it's enabled, even if empty (for required fields)
          data[fieldKey] = validCases;
        } else if (fieldSchema?.type === "output_list") {
          // Convert output list to proper YAML format - use internal state if available
          const sourceValue = internalOutputs.length > 0 ? internalOutputs : state.value;
          const validOutputs = sourceValue
            .filter((output: any) => output?.componentId && output?.component)
            .map((output: any) => {
              const outputObj: any = { [output.component]: {} };
              if (output.configYaml && output.configYaml.trim()) {
                try {
                  outputObj[output.component] = yaml.load(output.configYaml) || {};
                } catch (error) {
                  console.warn("Failed to parse output config YAML:", error);
                }
              }
              return outputObj;
            });
          
          // Always include the field if it's enabled, even if empty (for required fields)
          data[fieldKey] = validOutputs;
        } else if (fieldSchema?.type === "input_list") {
          // Convert input list to proper YAML format - use internal state if available
          const sourceValue = internalInputs.length > 0 ? internalInputs : state.value;
          const validInputs = sourceValue
            .filter((input: any) => input?.componentId && input?.component)
            .map((input: any) => {
              const inputObj: any = { [input.component]: {} };
              if (input.configYaml && input.configYaml.trim()) {
                try {
                  inputObj[input.component] = yaml.load(input.configYaml) || {};
                } catch (error) {
                  console.warn("Failed to parse input config YAML:", error);
                }
              }
              return inputObj;
            });
          
          // Always include the field if it's enabled, even if empty (for required fields)
          data[fieldKey] = validInputs;
        } else if (fieldSchema?.type === "processor_cases") {
          // Convert processor cases to proper YAML format - use internal state if available
          const sourceValue = internalProcessorCases.length > 0 ? internalProcessorCases : state.value;
          const validCases = sourceValue
            .filter((caseItem: any) => (caseItem.processors && caseItem.processors.length > 0))
            .map((caseItem: any) => {
              const result: any = {
                check: caseItem.check || ""
              };
              
              if (caseItem.processors && Array.isArray(caseItem.processors)) {
                const validProcessors = caseItem.processors
                  .filter((proc: any) => proc?.componentId && proc?.component)
                  .map((proc: any) => {
                    const selectedProcessor = availableProcessors.find(p => p.id === proc.componentId);
                    
                    if (selectedProcessor?.schema?.flat) {
                      // For flat components like mapping, use the raw string content
                      return { [proc.component]: proc.configYaml?.trim() || "" };
                    } else {
                      // For structured components, parse the YAML config
                      const processorObj: any = { [proc.component]: {} };
                      if (proc.configYaml && proc.configYaml.trim()) {
                        try {
                          processorObj[proc.component] = yaml.load(proc.configYaml) || {};
                        } catch (error) {
                          console.warn("Failed to parse processor config YAML:", error);
                        }
                      }
                      return processorObj;
                    }
                  });
                result.processors = validProcessors;
              } else {
                result.processors = [];
              }
              
              if (caseItem.fallthrough) {
                result.fallthrough = true;
              }
              
              return result;
            });
          
          // Always include the field if it's enabled, even if empty (for required fields)
          data[fieldKey] = validCases;
        } else {
          data[fieldKey] = state.value;
        }
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

  
  useEffect(() => {

    if (isFlat) return;


    if (lastOutputRef.current === yamlOutput) return;


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

      if (yamlOutput !== value && lastOutputRef.current !== yamlOutput) {
        lastOutputRef.current = yamlOutput;
        onChange(yamlOutput);
      }
      return;
    }


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

  // Nested processor component
  const NestedProcessor = ({ processor, index, onUpdate, onRemove }: {
    processor: { componentId?: string; component?: string; configYaml?: string };
    index: number;
    onUpdate: (index: number, field: string, value: string) => void;
    onRemove: (index: number) => void;
  }) => {
    const selectedProcessorSchema = processor.componentId 
      ? availableProcessors.find(p => p.id === processor.componentId)?.schema 
      : null;

    // Check if the selected processor is a flat component
    const isProcessorFlat = selectedProcessorSchema?.flat === true;
    const processorFlatFieldKey = isProcessorFlat && selectedProcessorSchema?.properties 
      ? Object.keys(selectedProcessorSchema.properties)[0] 
      : null;
    const processorFlatFieldSchema = processorFlatFieldKey && selectedProcessorSchema?.properties
      ? selectedProcessorSchema.properties[processorFlatFieldKey]
      : null;

    return (
      <div className="border border-gray-600 rounded p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span style={{ 
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#e5e7eb'
          }}>
            Processor {index + 1}:
          </span>
          <Button
            onClick={() => onRemove(index)}
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span style={{ 
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#e5e7eb'
            }}>
              component:
            </span>
            <Select 
              value={processor.componentId || ""} 
              onValueChange={(value) => onUpdate(index, 'componentId', value)}
            >
              <SelectTrigger 
                className="h-6 text-sm w-auto min-w-[120px] focus-visible:ring-1 focus-visible:ring-green-500"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: '#22c55e',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #404040',
                }}
              >
                <SelectValue placeholder="Select processor" />
              </SelectTrigger>
              <SelectContent>
                {availableProcessors.map((proc) => (
                  <SelectItem key={proc.id} value={proc.id}>
                    {proc.name === proc.component ? proc.component : `${proc.name} (${proc.component})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {processor.componentId && selectedProcessorSchema && (
            <div className="ml-4 border-l-2 border-gray-600 pl-3">
              <span style={{ 
                fontFamily: 'monospace',
                fontSize: '13px',
                color: '#e5e7eb',
                display: 'block',
                marginBottom: '8px'
              }}>
                config:
              </span>
              
              {/* Handle flat components specially */}
              {isProcessorFlat && processorFlatFieldKey && processorFlatFieldSchema ? (
                <div className="space-y-2">
                  <span style={{ 
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: '#6b7280'
                  }}>
                    {processorFlatFieldSchema.title || processorFlatFieldKey}
                  </span>
                  {processorFlatFieldSchema.type === "code" ? (
                    <CodeEditorField 
                      value={processor.configYaml || ""} 
                      onChange={(yamlValue) => onUpdate(index, 'configYaml', yamlValue)} 
                    />
                  ) : (
                    <Input
                      value={processor.configYaml || ""}
                      onChange={(e) => onUpdate(index, 'configYaml', e.target.value)}
                      className="h-6 text-sm p-1 focus-visible:ring-1 focus-visible:ring-green-500 focus-visible:border-green-500"
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        color: '#22c55e',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #404040',
                      }}
                      placeholder={processorFlatFieldSchema.description}
                    />
                  )}
                </div>
              ) : (
                /* Regular structured components */
                <InlineYamlEditor
                  schema={selectedProcessorSchema}
                  value={processor.configYaml || ""}
                  onChange={(yamlValue) => onUpdate(index, 'configYaml', yamlValue)}
                  availableProcessors={availableProcessors}
                />
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProcessorListEditor = (value: any[], updateValue: (value: any[]) => void) => {
    const addProcessor = () => {
      updateValue([...value, { componentId: "", component: "", configYaml: "" }]);
    };

    const updateProcessor = (index: number, field: string, newValue: string) => {
      const newProcessors = [...value];
      const processor = { ...newProcessors[index] };
      
      if (field === 'componentId') {
        const selectedProc = availableProcessors.find(p => p.id === newValue);
        const oldComponentId = processor.componentId;
        
        processor.componentId = newValue;
        processor.component = selectedProc ? selectedProc.component : "";
        
        // Reset config when component changes (including switching between different components)
        if (oldComponentId !== newValue) {
          processor.configYaml = "";
        }
      } else {
        processor[field] = newValue;
      }
      
      newProcessors[index] = processor;
      updateValue(newProcessors);
    };

    const removeProcessor = (index: number) => {
      updateValue(value.filter((_, i) => i !== index));
    };

    if (value.length === 0) {
      return (
        <div className="flex items-center space-x-2">
          <span style={{ 
            fontFamily: 'monospace',
            fontSize: '13px',
            color: '#6b7280'
          }}>
            []
          </span>
          <Button
            onClick={addProcessor}
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 bg-gray-700 hover:bg-gray-600"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {value.map((processor, index) => (
          <NestedProcessor
            key={index}
            processor={processor}
            index={index}
            onUpdate={updateProcessor}
            onRemove={removeProcessor}
          />
        ))}
        <Button
          onClick={addProcessor}
          size="sm"
          variant="ghost"
          className="h-6 text-sm bg-gray-700 hover:bg-gray-600"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Processor
        </Button>
      </div>
    );
  };

  const renderOutputCasesEditor = (value: any[], updateValue: (value: any[]) => void) => {
    const displayValue = internalOutputCases.length > 0 ? internalOutputCases : value;



    const addCase = () => {
      const newCase = { check: "", output: { componentId: "", component: "", configYaml: "" }, continue: false };
      const updatedCases = [...displayValue, newCase];
      setInternalOutputCases(updatedCases);
      

      isInternalUpdateRef.current = true;
      updateValue(updatedCases);
    };

    const updateCase = (index: number, field: string, newValue: any) => {
      const updatedCases = [...displayValue];
      if (field === "check" || field === "continue") {
        updatedCases[index] = { ...updatedCases[index], [field]: newValue };
      } else if (field.startsWith("output.")) {
        const outputField = field.replace("output.", "");
        updatedCases[index] = {
          ...updatedCases[index],
          output: { ...updatedCases[index].output, [outputField]: newValue }
        };
      }
      
      setInternalOutputCases(updatedCases);
      

      isInternalUpdateRef.current = true;
      updateValue(updatedCases);
    };

    const removeCase = (index: number) => {
      const updatedCases = displayValue.filter((_: any, i: number) => i !== index);
      setInternalOutputCases(updatedCases);
      

      isInternalUpdateRef.current = true;
      updateValue(updatedCases);
    };

    return (
      <div className="space-y-2">
        {displayValue.map((caseItem: any, index: number) => (
          <div key={index} className="border border-gray-600 rounded p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Case {index + 1}</span>
              <Button
                onClick={() => removeCase(index)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Check (Bloblang query):</label>
              <Input
                value={caseItem.check || ""}
                onChange={(e) => updateCase(index, "check", e.target.value)}
                placeholder="e.g., this.type == 'foo'"
                className="h-6 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400">Output:</label>

              <Select
                value={caseItem.output?.componentId || ""}
                onValueChange={(value) => {
                  const output = availableOutputs.find(o => o.id === value);
                  if (output) {

                    const updatedCases = [...displayValue];
                    updatedCases[index] = {
                      ...updatedCases[index],
                      output: {
                        componentId: value,
                        component: output.component,
                        configYaml: ""
                      }
                    };
                    setInternalOutputCases(updatedCases);
                    

                    isInternalUpdateRef.current = true;
                    updateValue(updatedCases);
                  }
                }}
              >
                <SelectTrigger className="h-6 text-xs">
                  <SelectValue placeholder="Select output..." />
                </SelectTrigger>
                <SelectContent>
                  {availableOutputs.map((output) => (
                    <SelectItem key={output.id} value={output.id}>
                      {output.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {caseItem.output?.componentId && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Output Configuration:</label>
                <InlineYamlEditor
                  schema={availableOutputs.find(o => o.id === caseItem.output?.componentId)?.schema || {}}
                  value={caseItem.output?.configYaml || ""}
                  onChange={(yamlValue) => updateCase(index, "output.configYaml", yamlValue)}
                  availableProcessors={availableProcessors}
                  availableInputs={availableInputs}
                  availableOutputs={availableOutputs}
                />
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                checked={caseItem.continue || false}
                onCheckedChange={(checked) => updateCase(index, "continue", checked)}
                className="scale-75"
              />
              <label className="text-xs text-gray-400">Continue to next case</label>
            </div>
          </div>
        ))}
        <Button
          onClick={addCase}
          size="sm"
          variant="ghost"
          className="h-6 text-sm bg-gray-700 hover:bg-gray-600"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Case
        </Button>
      </div>
    );
  };

  const renderOutputListEditor = (value: any[], updateValue: (value: any[]) => void) => {
    const displayValue = internalOutputs.length > 0 ? internalOutputs : value;

    const addOutput = () => {
      const newOutput = { componentId: "", component: "", configYaml: "" };
      const updatedOutputs = [...displayValue, newOutput];
      setInternalOutputs(updatedOutputs);
      

      isInternalUpdateRef.current = true;
      updateValue(updatedOutputs);
    };

    const updateOutput = (index: number, field: string, newValue: string) => {
      const updatedOutputs = [...displayValue];
      if (field === "componentId") {
        const output = availableOutputs.find(o => o.id === newValue);
        if (output) {
          updatedOutputs[index] = {
            ...updatedOutputs[index],
            componentId: newValue,
            component: output.component,
            configYaml: ""
          };
        }
      } else {
        updatedOutputs[index] = { ...updatedOutputs[index], [field]: newValue };
      }
      setInternalOutputs(updatedOutputs);
      

      isInternalUpdateRef.current = true;
      updateValue(updatedOutputs);
    };

    const removeOutput = (index: number) => {
      const updatedOutputs = displayValue.filter((_: any, i: number) => i !== index);
      setInternalOutputs(updatedOutputs);
      
  
      isInternalUpdateRef.current = true;
      updateValue(updatedOutputs);
    };

    return (
      <div className="space-y-2">
        {displayValue.map((output: any, index: number) => (
          <div key={index} className="border border-gray-600 rounded p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Output {index + 1}</span>
              <Button
                onClick={() => removeOutput(index)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Component:</label>
              <Select
                value={output.componentId || ""}
                onValueChange={(value) => updateOutput(index, "componentId", value)}
              >
                <SelectTrigger className="h-6 text-xs">
                  <SelectValue placeholder="Select output..." />
                </SelectTrigger>
                <SelectContent>
                  {availableOutputs.map((availableOutput) => (
                    <SelectItem key={availableOutput.id} value={availableOutput.id}>
                      {availableOutput.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {output.componentId && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Configuration:</label>
                <InlineYamlEditor
                  schema={availableOutputs.find(o => o.id === output.componentId)?.schema || {}}
                  value={output.configYaml || ""}
                  onChange={(yamlValue) => updateOutput(index, "configYaml", yamlValue)}
                  availableProcessors={availableProcessors}
                  availableInputs={availableInputs}
                  availableOutputs={availableOutputs}
                />
              </div>
            )}
          </div>
        ))}
        <Button
          onClick={addOutput}
          size="sm"
          variant="ghost"
          className="h-6 text-sm bg-gray-700 hover:bg-gray-600"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Output
        </Button>
      </div>
    );
  };

  const renderInputListEditor = (value: any[], updateValue: (value: any[]) => void) => {
    const displayValue = internalInputs.length > 0 ? internalInputs : value;

    const addInput = () => {
      const newInput = { componentId: "", component: "", configYaml: "" };
      const updatedInputs = [...displayValue, newInput];
      setInternalInputs(updatedInputs);
      

      isInternalUpdateRef.current = true;
      updateValue(updatedInputs);
    };

    const updateInput = (index: number, field: string, newValue: string) => {
      const updatedInputs = [...displayValue];
      if (field === "componentId") {
        const input = availableInputs.find(i => i.id === newValue);
        if (input) {
          updatedInputs[index] = {
            ...updatedInputs[index],
            componentId: newValue,
            component: input.component,
            configYaml: ""
          };
        }
      } else {
        updatedInputs[index] = { ...updatedInputs[index], [field]: newValue };
      }
      setInternalInputs(updatedInputs);
      

      isInternalUpdateRef.current = true;
      updateValue(updatedInputs);
    };

    const removeInput = (index: number) => {
      const updatedInputs = displayValue.filter((_: any, i: number) => i !== index);
      setInternalInputs(updatedInputs);
      

      isInternalUpdateRef.current = true;
      updateValue(updatedInputs);
    };

    return (
      <div className="space-y-2">
        {displayValue.map((input: any, index: number) => (
          <div key={index} className="border border-gray-600 rounded p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Input {index + 1}</span>
              <Button
                onClick={() => removeInput(index)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Component:</label>
              <Select
                value={input.componentId || ""}
                onValueChange={(value) => updateInput(index, "componentId", value)}
              >
                <SelectTrigger className="h-6 text-xs">
                  <SelectValue placeholder="Select input..." />
                </SelectTrigger>
                <SelectContent>
                  {availableInputs.map((availableInput) => (
                    <SelectItem key={availableInput.id} value={availableInput.id}>
                      {availableInput.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {input.componentId && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Configuration:</label>
                <InlineYamlEditor
                  schema={availableInputs.find(i => i.id === input.componentId)?.schema || {}}
                  value={input.configYaml || ""}
                  onChange={(yamlValue) => updateInput(index, "configYaml", yamlValue)}
                  availableProcessors={availableProcessors}
                  availableInputs={availableInputs}
                  availableOutputs={availableOutputs}
                />
              </div>
            )}
          </div>
        ))}
        <Button
          onClick={addInput}
          size="sm"
          variant="ghost"
          className="h-6 text-sm bg-gray-700 hover:bg-gray-600"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Input
        </Button>
      </div>
    );
  };

  const renderProcessorCasesEditor = (value: any[], updateValue: (value: any[]) => void) => {
    const displayValue = internalProcessorCases.length > 0 ? internalProcessorCases : value;

    const addCase = () => {
      const newCase = { check: "", processors: [], fallthrough: false };
      const updatedCases = [...displayValue, newCase];
      setInternalProcessorCases(updatedCases);
      

      isInternalUpdateRef.current = true;
      updateValue(updatedCases);
    };

    const updateCase = (index: number, field: string, newValue: any) => {
      const updatedCases = [...displayValue];
      updatedCases[index] = { ...updatedCases[index], [field]: newValue };
      setInternalProcessorCases(updatedCases);
      

      isInternalUpdateRef.current = true;
      updateValue(updatedCases);
    };

    const removeCase = (index: number) => {
      const updatedCases = displayValue.filter((_: any, i: number) => i !== index);
      setInternalProcessorCases(updatedCases);
      

      isInternalUpdateRef.current = true;
      updateValue(updatedCases);
    };

    return (
      <div className="space-y-2">
        {displayValue.map((caseItem: any, index: number) => (
          <div key={index} className="border border-gray-600 rounded p-2 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300">Case {index + 1}</span>
              <Button
                onClick={() => removeCase(index)}
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Check (Bloblang query - leave empty for default case):</label>
              <Input
                value={caseItem.check || ""}
                onChange={(e) => updateCase(index, "check", e.target.value)}
                placeholder="e.g., this.type == 'foo' (empty = default case)"
                className="h-6 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-gray-400">Processors:</label>
              {renderProcessorListEditor(caseItem.processors || [], (processors) => updateCase(index, "processors", processors))}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={caseItem.fallthrough || false}
                onCheckedChange={(checked) => updateCase(index, "fallthrough", checked)}
                className="scale-75"
              />
              <label className="text-xs text-gray-400">Fallthrough (continue to next case)</label>
            </div>
          </div>
        ))}
        <Button
          onClick={addCase}
          size="sm"
          variant="ghost"
          className="h-6 text-sm bg-gray-700 hover:bg-gray-600"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Case
        </Button>
      </div>
    );
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

        case "processor_list":
          return renderProcessorListEditor(state.value || [], handleValueChange);

        case "output_cases":
          return renderOutputCasesEditor(state.value || [], handleValueChange);

        case "output_list":
          return renderOutputListEditor(state.value || [], handleValueChange);

        case "input_list":
          return renderInputListEditor(state.value || [], handleValueChange);

        case "processor_cases":
          return renderProcessorCasesEditor(state.value || [], handleValueChange);

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

  // Initialize internal processor state from YAML value (only for external changes)
  useEffect(() => {
    if (isFlat && flatFieldSchema?.type === "processor_list" && !isInternalUpdateRef.current) {
      const parsedValue = getCurrentValue();
      if (Array.isArray(parsedValue)) {
        setInternalProcessors(parsedValue);
      }
    } else if (isFlat && flatFieldSchema?.type === "processor_cases" && !isInternalUpdateRef.current) {
      const parsedValue = getCurrentValue();
      if (Array.isArray(parsedValue)) {
        setInternalProcessorCases(parsedValue);
      }
    }
    // Reset the flag after processing
    isInternalUpdateRef.current = false;
  }, [value, isFlat, flatFieldSchema?.type]);

  // Reset internal update flag after each render cycle
  useEffect(() => {
    isInternalUpdateRef.current = false;
  });

  // Initialize internal states from field states
  useEffect(() => {
    Object.entries(fieldStates).forEach(([fieldKey, state]) => {
      const fieldSchema = actualSchema[fieldKey];
      if (state.enabled && Array.isArray(state.value)) {
        if (fieldSchema?.type === "output_cases" && internalOutputCases.length === 0 && state.value.length > 0) {
          // Convert API format to internal format for output cases
          const convertedCases = state.value.map((caseItem: any) => {
            if (typeof caseItem === 'object' && caseItem.output) {
              const outputComponent = Object.keys(caseItem.output)[0];
              const outputConfig = caseItem.output[outputComponent];
              const outputSchema = availableOutputs.find(o => o.component === outputComponent);
              
              return {
                check: caseItem.check || "",
                continue: caseItem.continue || false,
                output: {
                  componentId: outputSchema?.id || outputComponent,
                  component: outputComponent,
                  configYaml: outputConfig ? yaml.dump(outputConfig) : ""
                }
              };
            }
            return caseItem;
          });
          setInternalOutputCases(convertedCases);
        } else if (fieldSchema?.type === "output_list" && internalOutputs.length === 0 && state.value.length > 0) {
          // Convert API format to internal format for output list
          const convertedOutputs = state.value.map((output: any) => {
            if (typeof output === 'object' && output !== null) {
              const componentName = Object.keys(output)[0];
              const config = output[componentName];
              const outputSchema = availableOutputs.find(o => o.component === componentName);
              
              return {
                componentId: outputSchema?.id || componentName,
                component: componentName,
                configYaml: config ? yaml.dump(config) : ""
              };
            }
            return { componentId: "", component: "", configYaml: "" };
          });
          setInternalOutputs(convertedOutputs);
        } else if (fieldSchema?.type === "input_list" && internalInputs.length === 0 && state.value.length > 0) {
          // Convert API format to internal format for input list
          const convertedInputs = state.value.map((input: any) => {
            if (typeof input === 'object' && input !== null) {
              const componentName = Object.keys(input)[0];
              const config = input[componentName];
              const inputSchema = availableInputs.find(i => i.component === componentName);
              
              return {
                componentId: inputSchema?.id || componentName,
                component: componentName,
                configYaml: config ? yaml.dump(config) : ""
              };
            }
            return { componentId: "", component: "", configYaml: "" };
          });
          setInternalInputs(convertedInputs);
        } else if (fieldSchema?.type === "processor_cases" && internalProcessorCases.length === 0 && state.value.length > 0) {
          // Convert API format to internal format for processor cases
          const convertedCases = state.value.map((caseItem: any) => {
            const result: any = {
              check: caseItem.check || "",
              fallthrough: caseItem.fallthrough || false,
              processors: []
            };
            
            if (caseItem.processors && Array.isArray(caseItem.processors)) {
              result.processors = caseItem.processors.map((proc: any) => {
                if (typeof proc === 'object' && proc !== null) {
                  const componentName = Object.keys(proc)[0];
                  const config = proc[componentName];
                  const processorSchema = availableProcessors.find(p => p.component === componentName);
                  
                  // Handle flat components differently - they should store raw string content
                  if (processorSchema?.schema?.flat) {
                    return {
                      componentId: processorSchema?.id || componentName,
                      component: componentName,
                      configYaml: typeof config === 'string' ? config : (config ? yaml.dump(config) : "")
                    };
                  } else {
                    return {
                      componentId: processorSchema?.id || componentName,
                      component: componentName,
                      configYaml: config ? yaml.dump(config) : ""
                    };
                  }
                }
                return { componentId: "", component: "", configYaml: "" };
              });
            }
            
            return result;
          });
          setInternalProcessorCases(convertedCases);
        }
      }
    });
  }, [fieldStates, actualSchema, availableOutputs, availableInputs, availableProcessors]);

  // Parse existing value for processor list and processor cases
  const getCurrentValue = () => {
    if (flatFieldSchema?.type === "processor_list") {
      if (!value || !value.trim()) return [];
      try {
        const parsedYaml = yaml.load(value) || [];
        
        // Convert YAML format back to internal format
        if (Array.isArray(parsedYaml)) {
          return parsedYaml.map(proc => {
            if (typeof proc === 'object' && proc !== null) {
              const componentName = Object.keys(proc)[0];
              const config = proc[componentName];
              const processorSchema = availableProcessors.find(p => p.component === componentName);
              
              // Handle flat components differently - they should store raw string content
              if (processorSchema?.schema?.flat) {
                return {
                  componentId: processorSchema?.id || componentName,
                  component: componentName,
                  configYaml: typeof config === 'string' ? config : (config ? yaml.dump(config) : "")
                };
              } else {
                // For structured components, convert back to YAML
                return {
                  componentId: processorSchema?.id || componentName,
                  component: componentName,
                  configYaml: config ? yaml.dump(config) : ""
                };
              }
            }
            return { componentId: "", component: "", configYaml: "" };
          });
        }
        
        return [];
      } catch (error) {
        console.warn("Failed to parse processor list YAML:", error);
        return [];
      }
    } else if (flatFieldSchema?.type === "processor_cases") {
      if (!value || !value.trim()) return [];
      try {
        const parsedYaml = yaml.load(value) || [];
        
        // Convert YAML format back to internal format for processor cases
        if (Array.isArray(parsedYaml)) {
          return parsedYaml.map((caseItem: any) => {
            const result: any = {
              check: caseItem.check || "",
              fallthrough: caseItem.fallthrough || false,
              processors: []
            };
            
            if (caseItem.processors && Array.isArray(caseItem.processors)) {
              result.processors = caseItem.processors.map((proc: any) => {
                if (typeof proc === 'object' && proc !== null) {
                  const componentName = Object.keys(proc)[0];
                  const config = proc[componentName];
                  const processorSchema = availableProcessors.find(p => p.component === componentName);
                  
                  // Handle flat components differently - they should store raw string content
                  if (processorSchema?.schema?.flat) {
                    return {
                      componentId: processorSchema?.id || componentName,
                      component: componentName,
                      configYaml: typeof config === 'string' ? config : (config ? yaml.dump(config) : "")
                    };
                  } else {
                    return {
                      componentId: processorSchema?.id || componentName,
                      component: componentName,
                      configYaml: config ? yaml.dump(config) : ""
                    };
                  }
                }
                return { componentId: "", component: "", configYaml: "" };
              });
            }
            
            return result;
          });
        }
        
        return [];
      } catch (error) {
        console.warn("Failed to parse processor cases YAML:", error);
        return [];
      }
    }
    return value || "";
  };

  // For flat components, render just the editor directly
  if (isFlat && flatFieldKey && flatFieldSchema) {

    const handleFlatValueChange = (newValue: string | any[]) => {
      if (flatFieldSchema.type === "processor_list") {
        const processors = newValue as any[];
        
        // Mark this as an internal update to prevent useEffect from overriding
        isInternalUpdateRef.current = true;
        
        // Always update internal state with ALL processors (for UI display)
        setInternalProcessors(processors);
        
        // Convert to YAML only the processors that have valid configuration
        try {
          const processorsForYaml = processors
            .filter(proc => {
              if (!proc.componentId || !proc.component || !proc.configYaml || !proc.configYaml.trim()) {
                return false;
              }
              
              // Check if the config is valid for the current component type
              const selectedProcessor = availableProcessors.find(p => p.id === proc.componentId);
              if (selectedProcessor?.schema?.flat) {
                // For flat components, any non-empty string is valid
                return proc.configYaml.trim().length > 0;
              } else {
                // For structured components, try to parse the YAML to see if it's valid
                try {
                  const config = yaml.load(proc.configYaml);
                  return config && typeof config === 'object' && Object.keys(config).length > 0;
                } catch {
                  return false;
                }
              }
            })
            .map(proc => {
              const selectedProcessor = availableProcessors.find(p => p.id === proc.componentId);
              
              if (selectedProcessor?.schema?.flat) {
                // For flat components like mapping, create the processor object differently
                // to avoid YAML double-encoding the string content
                return { [proc.component]: proc.configYaml.trim() };
              } else {
                // For structured components, parse the YAML config
                const processorObj: any = { [proc.component]: {} };
                try {
                  const config = yaml.load(proc.configYaml) || {};
                  processorObj[proc.component] = config;
                } catch (error) {
                  console.warn("Failed to parse processor config YAML:", error);
                  processorObj[proc.component] = {};
                }
                return processorObj;
              }
            });
          
          const yamlOutput = processorsForYaml.length > 0 ? yaml.dump(processorsForYaml, {
            lineWidth: -1, // Don't wrap lines
            noRefs: true,  // Don't use references
            quotingType: '"', // Use double quotes when needed
            forceQuotes: false // Don't force quotes on strings
          }) : "";
          onChange(yamlOutput);
        } catch (error) {
          console.warn("Failed to convert processor list to YAML:", error);
          onChange("");
        }
      } else if (flatFieldSchema.type === "processor_cases") {
        const cases = newValue as any[];
        
        // Mark this as an internal update to prevent useEffect from overriding
        isInternalUpdateRef.current = true;
        
        // Always update internal state with ALL cases (for UI display)
        setInternalProcessorCases(cases);
        
        // Convert to YAML only the cases that have valid configuration
        try {
          const casesForYaml = cases
            .filter(caseItem => (caseItem.processors && caseItem.processors.length > 0))
            .map(caseItem => {
              const result: any = {
                check: caseItem.check || ""
              };
              
              if (caseItem.processors && Array.isArray(caseItem.processors)) {
                const validProcessors = caseItem.processors
                  .filter((proc: any) => proc?.componentId && proc?.component)
                  .map((proc: any) => {
                    const selectedProcessor = availableProcessors.find(p => p.id === proc.componentId);
                    
                    if (selectedProcessor?.schema?.flat) {
                      // For flat components like mapping, use the raw string content
                      return { [proc.component]: proc.configYaml?.trim() || "" };
                    } else {
                      // For structured components, parse the YAML config
                      const processorObj: any = { [proc.component]: {} };
                      if (proc.configYaml && proc.configYaml.trim()) {
                        try {
                          processorObj[proc.component] = yaml.load(proc.configYaml) || {};
                        } catch (error) {
                          console.warn("Failed to parse processor config YAML:", error);
                        }
                      }
                      return processorObj;
                    }
                  });
                result.processors = validProcessors;
              } else {
                result.processors = [];
              }
              
              if (caseItem.fallthrough) {
                result.fallthrough = true;
              }
              
              return result;
            });
          
          const yamlOutput = casesForYaml.length > 0 ? yaml.dump(casesForYaml, {
            lineWidth: -1, // Don't wrap lines
            noRefs: true,  // Don't use references
            quotingType: '"', // Use double quotes when needed
            forceQuotes: false // Don't force quotes on strings
          }) : "";
          onChange(yamlOutput);
        } catch (error) {
          console.warn("Failed to convert processor cases to YAML:", error);
          onChange("");
        }
      } else {
        onChange(newValue as string);
      }
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
            <CodeEditorField value={value || ""} onChange={handleFlatValueChange as (value: string) => void} />
          ) : flatFieldSchema.type === "processor_list" ? (
            renderProcessorListEditor(
              internalProcessors, 
              handleFlatValueChange as (value: any[]) => void
            )
          ) : flatFieldSchema.type === "processor_cases" ? (
            renderProcessorCasesEditor(
              internalProcessorCases, 
              handleFlatValueChange as (value: any[]) => void
            )
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
        {Object.entries(actualSchema).map(([fieldKey, fieldSchema]) =>
          renderInlineField(fieldKey, fieldSchema)
        )}
      </div>
    </div>
  );
} 