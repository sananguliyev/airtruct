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
import { useTheme } from "next-themes";
import * as yaml from "js-yaml";
import { fetchCaches, fetchSecrets } from "@/lib/api";

import { InlineYamlEditorProps, FieldState, FieldSchema } from "./types";
import { getDefaultValue } from "./utils/defaults";
import { useInternalState } from "./hooks/use-internal-state";
import {
  convertOutputCasesToYaml,
  convertOutputListToYaml,
  convertInputListToYaml,
  convertProcessorCasesToYaml,
  convertYamlToOutputCases,
  convertYamlToOutputList,
  convertYamlToInputList,
  convertYamlToProcessorCases,
} from "./utils/yaml-converter";
import {
  TextInputField,
  KeyValueEditor,
  OutputListEditor,
  InputListEditor,
} from "./components";
import {
  LazyOutputCasesEditor,
  LazyProcessorCasesEditor,
  LazyProcessorListEditor,
  LazyCodeEditorField,
  LazyObjectEditor,
  LazyArrayEditor,
} from "./components/lazy-components";
import { Suspense } from "react";

function DynamicSelectField({
  fieldSchema,
  value,
  onChange,
  isDark,
  inputStyle,
}: {
  fieldSchema: FieldSchema;
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
  inputStyle: React.CSSProperties;
}) {
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        if (fieldSchema.dataSource === "caches") {
          const caches = await fetchCaches();
          setOptions(caches.map((cache) => cache.label));
        } else if (fieldSchema.dataSource === "secrets") {
          const secrets = await fetchSecrets();
          setOptions(secrets.map((secret) => secret.key));
        }
      } catch (error) {
        console.error("Failed to fetch options:", error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [fieldSchema.dataSource]);

  if (loading) {
    return (
      <div className="text-xs text-muted-foreground font-mono">Loading...</div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`h-6 text-sm w-auto min-w-[100px] bg-background border-border text-foreground
          focus-visible:ring-1 focus-visible:ring-ring font-mono ${isDark ? "text-green-400" : "text-green-600"}`}
        style={inputStyle}
      >
        <SelectValue
          placeholder={options.length === 0 ? "No options" : "Select..."}
        />
      </SelectTrigger>
      <SelectContent>
        {options.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            No {fieldSchema.dataSource} available
          </div>
        ) : (
          options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export function InlineYamlEditor({
  schema,
  value,
  onChange,
  availableProcessors = [],
  availableInputs = [],
  availableOutputs = [],
  previewMode = false,
}: InlineYamlEditorProps) {
  const [fieldStates, setFieldStates] = useState<Record<string, FieldState>>(
    {},
  );
  const lastOutputRef = React.useRef<string>("");
  const { resolvedTheme } = useTheme();

  const {
    internalProcessors,
    setInternalProcessors,
    internalInputs,
    setInternalInputs,
    internalOutputs,
    setInternalOutputs,
    internalOutputCases,
    setInternalOutputCases,
    internalProcessorCases,
    setInternalProcessorCases,
    isInternalUpdateRef,
  } = useInternalState();

  const isFlat = schema.flat === true;
  const actualSchema = schema.properties || {};
  const flatFieldKey = isFlat ? Object.keys(actualSchema)[0] : null;
  const flatFieldSchema = flatFieldKey ? actualSchema[flatFieldKey] : null;

  useEffect(() => {
    // Initialize internal state for flat processor lists
    if (isFlat && flatFieldSchema?.type === "processor_list") {
      const currentValue = Array.isArray(getCurrentValue())
        ? (getCurrentValue() as any[])
        : [];
      if (currentValue.length > 0 && internalProcessors.length === 0) {
        setInternalProcessors(currentValue);
      }
      return;
    }

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

    Object.entries(actualSchema).forEach(([fieldKey, fieldSchema]) => {
      const hasExistingValue = existingData.hasOwnProperty(fieldKey);
      const isRequired = fieldSchema.required === true;

      let initialValue = hasExistingValue
        ? existingData[fieldKey]
        : getDefaultValue(fieldSchema);

      if (hasExistingValue && Array.isArray(existingData[fieldKey])) {
        if (fieldSchema.type === "output_cases") {
          initialValue = convertYamlToOutputCases(
            existingData[fieldKey],
            availableOutputs,
          );
          setInternalOutputCases(initialValue);
        } else if (fieldSchema.type === "output_list") {
          initialValue = convertYamlToOutputList(
            existingData[fieldKey],
            availableOutputs,
          );
          setInternalOutputs(initialValue);
        } else if (fieldSchema.type === "input_list") {
          initialValue = convertYamlToInputList(
            existingData[fieldKey],
            availableInputs,
          );
          setInternalInputs(initialValue);
        } else if (fieldSchema.type === "processor_cases") {
          initialValue = convertYamlToProcessorCases(
            existingData[fieldKey],
            availableProcessors,
          );
          setInternalProcessorCases(initialValue);
        }
      }

      initialStates[fieldKey] = {
        enabled: isRequired || hasExistingValue,
        value: initialValue,
      };
    });

    setFieldStates((prev) => {
      const hasChanges = Object.keys(initialStates).some(
        (key) =>
          !prev[key] ||
          prev[key].enabled !== initialStates[key].enabled ||
          JSON.stringify(prev[key].value) !==
            JSON.stringify(initialStates[key].value),
      );

      if (
        hasChanges ||
        Object.keys(prev).length !== Object.keys(initialStates).length
      ) {
        return initialStates;
      }

      return prev;
    });
  }, [
    actualSchema,
    value,
    isFlat,
    availableProcessors,
    availableInputs,
    availableOutputs,
    internalProcessors.length,
  ]);

  const yamlOutput = useMemo(() => {
    if (isFlat) return value || "";

    const data: any = {};

    Object.entries(fieldStates).forEach(([fieldKey, state]) => {
      if (state.enabled && state.value !== undefined) {
        const fieldSchema = actualSchema[fieldKey];

        if (fieldSchema?.type === "output_cases") {
          const sourceValue =
            internalOutputCases.length > 0 ? internalOutputCases : state.value;
          const validCases = convertOutputCasesToYaml(
            sourceValue,
            availableOutputs,
          );
          data[fieldKey] = validCases;
        } else if (fieldSchema?.type === "output_list") {
          const sourceValue =
            internalOutputs.length > 0 ? internalOutputs : state.value;
          const validOutputs = convertOutputListToYaml(
            sourceValue,
            availableOutputs,
          );
          data[fieldKey] = validOutputs;
        } else if (fieldSchema?.type === "input_list") {
          const sourceValue =
            internalInputs.length > 0 ? internalInputs : state.value;
          const validInputs = convertInputListToYaml(
            sourceValue,
            availableInputs,
          );
          data[fieldKey] = validInputs;
        } else if (fieldSchema?.type === "processor_cases") {
          const sourceValue =
            internalProcessorCases.length > 0
              ? internalProcessorCases
              : state.value;
          const validCases = convertProcessorCasesToYaml(
            sourceValue,
            availableProcessors,
          );
          data[fieldKey] = validCases;
        } else {
          data[fieldKey] = state.value;
        }
      }
    });

    if (Object.keys(data).length === 0) {
      return "";
    }

    try {
      return yaml.dump(data, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        quotingType: '"',
        forceQuotes: false,
      });
    } catch (error) {
      console.error("Failed to generate YAML:", error);
      return "";
    }
  }, [
    fieldStates,
    isFlat,
    value,
    internalOutputCases,
    internalOutputs,
    internalInputs,
    internalProcessorCases,
    availableOutputs,
    availableInputs,
    availableProcessors,
    actualSchema,
  ]);

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
    setFieldStates((prev) => ({
      ...prev,
      [fieldKey]: { ...prev[fieldKey], ...updates },
    }));
  };

  const renderValueInput = (
    fieldSchema: FieldSchema,
    state: FieldState,
    handleValueChange: (value: any) => void,
  ) => {
    const isDark = resolvedTheme === "dark";

    const inputStyle = {
      fontFamily: "monospace",
      fontSize: "13px",
    };

    const inputClassName = `h-6 text-sm p-1 bg-background border-border text-foreground
      focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring
      font-mono text-xs ${isDark ? "text-green-400" : "text-green-600"}`;

    switch (fieldSchema.type) {
      case "input":
        return (
          <TextInputField
            value={state.value || ""}
            onChange={handleValueChange}
            previewMode={previewMode}
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
              className={`ml-2 font-mono text-xs ${isDark ? "text-green-400" : "text-green-600"}`}
            >
              {state.value ? "true" : "false"}
            </span>
          </div>
        );

      case "select":
        return (
          <Select value={state.value || ""} onValueChange={handleValueChange}>
            <SelectTrigger
              className={`h-6 text-sm w-auto min-w-[100px] bg-background border-border text-foreground
                focus-visible:ring-1 focus-visible:ring-ring font-mono ${isDark ? "text-green-400" : "text-green-600"}`}
              style={inputStyle}
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

      case "dynamic_select":
        return (
          <DynamicSelectField
            fieldSchema={fieldSchema}
            value={state.value || ""}
            onChange={handleValueChange}
            isDark={isDark}
            inputStyle={inputStyle}
          />
        );

      case "code":
        return (
          <Suspense
            fallback={<div className="text-xs text-gray-400">Loading...</div>}
          >
            <LazyCodeEditorField
              value={state.value || ""}
              onChange={handleValueChange}
              previewMode={previewMode}
            />
          </Suspense>
        );

      case "key_value":
        return (
          <KeyValueEditor
            value={state.value || {}}
            updateValue={handleValueChange}
            previewMode={previewMode}
          />
        );

      case "array":
        return (
          <Suspense
            fallback={<div className="text-xs text-gray-400">Loading...</div>}
          >
            <LazyArrayEditor
              value={state.value || []}
              updateValue={handleValueChange}
              previewMode={previewMode}
            />
          </Suspense>
        );

      case "object":
        return (
          <Suspense
            fallback={<div className="text-xs text-gray-400">Loading...</div>}
          >
            <LazyObjectEditor
              value={state.value || {}}
              updateValue={handleValueChange}
              fieldSchema={fieldSchema}
              previewMode={previewMode}
            />
          </Suspense>
        );

      case "processor_list":
        return (
          <Suspense
            fallback={<div className="text-xs text-gray-400">Loading...</div>}
          >
            <LazyProcessorListEditor
              value={state.value || []}
              updateValue={handleValueChange}
              availableProcessors={availableProcessors}
              availableInputs={availableInputs}
              availableOutputs={availableOutputs}
              previewMode={previewMode}
            />
          </Suspense>
        );

      case "output_cases":
        return (
          <Suspense
            fallback={<div className="text-xs text-gray-400">Loading...</div>}
          >
            <LazyOutputCasesEditor
              value={state.value || []}
              updateValue={handleValueChange}
              availableOutputs={availableOutputs}
              availableProcessors={availableProcessors}
              availableInputs={availableInputs}
              internalValue={internalOutputCases}
              setInternalValue={setInternalOutputCases}
              isInternalUpdateRef={isInternalUpdateRef}
              previewMode={previewMode}
            />
          </Suspense>
        );

      case "output_list":
        return (
          <OutputListEditor
            value={state.value || []}
            updateValue={handleValueChange}
            availableOutputs={availableOutputs}
            availableProcessors={availableProcessors}
            availableInputs={availableInputs}
            previewMode={previewMode}
          />
        );

      case "input_list":
        return (
          <InputListEditor
            value={state.value || []}
            updateValue={handleValueChange}
            availableInputs={availableInputs}
            availableProcessors={availableProcessors}
            availableOutputs={availableOutputs}
            previewMode={previewMode}
          />
        );

      case "processor_cases":
        return (
          <Suspense
            fallback={<div className="text-xs text-gray-400">Loading...</div>}
          >
            <LazyProcessorCasesEditor
              value={state.value || []}
              updateValue={handleValueChange}
              availableProcessors={availableProcessors}
              availableInputs={availableInputs}
              availableOutputs={availableOutputs}
              previewMode={previewMode}
            />
          </Suspense>
        );

      default:
        return (
          <TextInputField
            value={String(state.value || "")}
            onChange={handleValueChange}
            previewMode={previewMode}
            placeholder="Enter value..."
          />
        );
    }
  };

  const renderInlineField = (fieldKey: string, fieldSchema: FieldSchema) => {
    const state = fieldStates[fieldKey];
    const isRequired = fieldSchema.required === true;

    if (!state) return null;

    // In preview mode, hide non-selected fields
    if (previewMode && !state.enabled) return null;

    const handleValueChange = (newValue: any) => {
      updateFieldState(fieldKey, { value: newValue });
    };

    return (
      <div key={fieldKey} className="flex items-center space-x-2 py-1">
        {!previewMode && (
          <Checkbox
            checked={state.enabled}
            disabled={isRequired}
            onCheckedChange={(checked) =>
              updateFieldState(fieldKey, { enabled: checked as boolean })
            }
            className="h-4 w-4"
          />
        )}
        <span
          className={`min-w-0 font-mono text-xs ${state.enabled ? "text-foreground" : "text-muted-foreground"}`}
        >
          {fieldKey}:
        </span>
        {state.enabled && (
          <div className="flex-1 min-w-0">
            {renderValueInput(fieldSchema, state, handleValueChange)}
          </div>
        )}
        {!previewMode && isRequired && (
          <span className="text-red-500 text-xs">*</span>
        )}
      </div>
    );
  };

  const getCurrentValue = (): any[] | string => {
    if (flatFieldSchema?.type === "processor_list") {
      if (!value || !value.trim()) return [];
      try {
        const parsedYaml = yaml.load(value) || [];

        if (Array.isArray(parsedYaml)) {
          return parsedYaml.map((proc) => {
            if (typeof proc === "object" && proc !== null) {
              const componentName = Object.keys(proc)[0];
              const config = proc[componentName];
              const processorSchema = availableProcessors.find(
                (p) => p.component === componentName,
              );

              if (processorSchema?.schema?.flat) {
                return {
                  componentId: processorSchema?.id || componentName,
                  component: componentName,
                  configYaml:
                    typeof config === "string"
                      ? config
                      : config
                        ? yaml.dump(config)
                        : "",
                };
              } else {
                return {
                  componentId: processorSchema?.id || componentName,
                  component: componentName,
                  configYaml: config ? yaml.dump(config) : "",
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
        if (Array.isArray(parsedYaml)) {
          return convertYamlToProcessorCases(parsedYaml, availableProcessors);
        }
        return [];
      } catch (error) {
        console.warn("Failed to parse processor cases YAML:", error);
        return [];
      }
    }
    return value || "";
  };

  if (isFlat && flatFieldKey && flatFieldSchema) {
    const handleFlatValueChange = (newValue: string | any[]) => {
      if (typeof newValue === "string") {
        onChange(newValue);
      } else if (flatFieldSchema.type === "processor_list") {
        // Store the raw processor array (including incomplete ones) for getCurrentValue
        const currentProcessors = Array.isArray(newValue) ? newValue : [];

        try {
          const processorsForYaml = currentProcessors
            .filter((proc) => {
              if (
                !proc.componentId ||
                !proc.component ||
                !proc.configYaml ||
                !proc.configYaml.trim()
              ) {
                return false;
              }

              const selectedProcessor = availableProcessors.find(
                (p) => p.id === proc.componentId,
              );
              if (selectedProcessor?.schema?.flat) {
                return proc.configYaml.trim().length > 0;
              } else {
                try {
                  const config = yaml.load(proc.configYaml);
                  return (
                    config &&
                    typeof config === "object" &&
                    Object.keys(config).length > 0
                  );
                } catch {
                  return false;
                }
              }
            })
            .map((proc) => {
              const selectedProcessor = availableProcessors.find(
                (p) => p.id === proc.componentId,
              );

              if (selectedProcessor?.schema?.flat) {
                return { [proc.component]: proc.configYaml.trim() };
              } else {
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

          const yamlOutput =
            processorsForYaml.length > 0
              ? yaml.dump(processorsForYaml, {
                  lineWidth: -1,
                  noRefs: true,
                  quotingType: '"',
                  forceQuotes: false,
                })
              : "";
          onChange(yamlOutput);
        } catch (error) {
          console.warn("Failed to convert processor list to YAML:", error);
          onChange("");
        }
      } else if (flatFieldSchema.type === "processor_cases") {
        try {
          const validCases = convertProcessorCasesToYaml(
            newValue,
            availableProcessors,
          );
          const yamlOutput =
            validCases.length > 0
              ? yaml.dump(validCases, {
                  lineWidth: -1,
                  noRefs: true,
                  quotingType: '"',
                  forceQuotes: false,
                })
              : "";
          onChange(yamlOutput);
        } catch (error) {
          console.warn("Failed to convert processor cases to YAML:", error);
          onChange("");
        }
      }
    };

    return (
      <div className="font-mono text-sm p-4 bg-background text-foreground rounded-md border border-border">
        <div className="space-y-2">
          <span className="text-sm text-muted-foreground">
            {flatFieldSchema.title || flatFieldKey}
          </span>
          {flatFieldSchema.type === "code" ? (
            <Suspense
              fallback={<div className="text-xs text-gray-400">Loading...</div>}
            >
              <LazyCodeEditorField
                value={value || ""}
                onChange={handleFlatValueChange as (value: string) => void}
                previewMode={previewMode}
              />
            </Suspense>
          ) : flatFieldSchema.type === "processor_list" ? (
            <Suspense
              fallback={<div className="text-xs text-gray-400">Loading...</div>}
            >
              <LazyProcessorListEditor
                value={
                  internalProcessors.length > 0
                    ? internalProcessors
                    : Array.isArray(getCurrentValue())
                      ? (getCurrentValue() as any[])
                      : []
                }
                updateValue={(newValue: any[]) => {
                  setInternalProcessors(newValue);
                  isInternalUpdateRef.current = true;
                  handleFlatValueChange(newValue);
                }}
                availableProcessors={availableProcessors}
                previewMode={previewMode}
              />
            </Suspense>
          ) : flatFieldSchema.type === "processor_cases" ? (
            <Suspense
              fallback={<div className="text-xs text-gray-400">Loading...</div>}
            >
              <LazyProcessorCasesEditor
                value={
                  Array.isArray(getCurrentValue())
                    ? (getCurrentValue() as any[])
                    : []
                }
                updateValue={handleFlatValueChange as (value: any[]) => void}
                availableProcessors={availableProcessors}
                previewMode={previewMode}
              />
            </Suspense>
          ) : (
            <TextInputField
              value={value || ""}
              onChange={handleFlatValueChange as (value: string) => void}
              previewMode={previewMode}
              placeholder={flatFieldSchema.description}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="font-mono text-sm p-4 bg-background text-foreground rounded-md border border-border">
      <div className="space-y-1">
        {Object.entries(actualSchema).map(([fieldKey, fieldSchema]) =>
          renderInlineField(fieldKey, fieldSchema),
        )}
      </div>
    </div>
  );
}
