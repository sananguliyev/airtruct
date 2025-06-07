import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import { ProcessorComponentSchema } from "../types";
import { TextInputField } from "./text-input-field";
import { LazyCodeEditorField } from "./lazy-components";
import { InlineYamlEditor } from "../inline-yaml-editor";
import { Suspense } from "react";

interface NestedProcessorProps {
  processor: { componentId?: string; component?: string; configYaml?: string };
  index: number;
  onUpdate: (index: number, field: string, value: string) => void;
  onRemove: (index: number) => void;
  availableProcessors: ProcessorComponentSchema[];
  availableInputs?: ProcessorComponentSchema[];
  availableOutputs?: ProcessorComponentSchema[];
  previewMode?: boolean;
}

export function NestedProcessor({ 
  processor, 
  index, 
  onUpdate, 
  onRemove, 
  availableProcessors,
  availableInputs = [],
  availableOutputs = [],
  previewMode = false 
}: NestedProcessorProps) {
  const selectedProcessorSchema = processor.componentId 
    ? availableProcessors.find(p => p.id === processor.componentId)?.schema 
    : null;

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
        {!previewMode && (
          <Button
            onClick={() => onRemove(index)}
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
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
            disabled={previewMode}
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
                  <Suspense fallback={<div className="text-xs text-gray-400">Loading...</div>}>
                    <LazyCodeEditorField 
                      value={processor.configYaml || ""} 
                      onChange={(yamlValue: string) => onUpdate(index, 'configYaml', yamlValue)} 
                      previewMode={previewMode}
                    />
                  </Suspense>
                ) : (
                  <TextInputField
                    value={processor.configYaml || ""}
                    onChange={(yamlValue) => onUpdate(index, 'configYaml', yamlValue)}
                    previewMode={previewMode}
                    placeholder={processorFlatFieldSchema.description}
                  />
                )}
              </div>
            ) : (
              <InlineYamlEditor
                schema={selectedProcessorSchema}
                value={processor.configYaml || ""}
                onChange={(yamlValue: string) => onUpdate(index, 'configYaml', yamlValue)}
                availableProcessors={availableProcessors}
                availableInputs={availableInputs}
                availableOutputs={availableOutputs}
                previewMode={previewMode}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
} 