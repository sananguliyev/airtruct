import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CodeEditor } from "@/components/code-editor";

interface NestedFormFieldProps {
  field: any;
  fieldKey: string;
  value: any;
  onChange: (key: string, value: any) => void;
  path?: string;
}

export function NestedFormField({
  field,
  fieldKey,
  value,
  onChange,
  path = "",
}: NestedFormFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const fullPath = path ? `${path}.${fieldKey}` : fieldKey;

  // Handle key-value pairs (objects that should be edited as key-value pairs)
  if (field.type === "key_value") {
    const objectValue =
      typeof value === "object" && value !== null ? value : {};

    const handleAddKeyValue = () => {
      // Add a new empty key-value pair
      const newKey = `key_${Object.keys(objectValue).length + 1}`;
      onChange(fullPath, { ...objectValue, [newKey]: "" });
    };

    const handleRemoveKeyValue = (key: string) => {
      const newValue = { ...objectValue };
      delete newValue[key];
      onChange(fullPath, newValue);
    };

    const handleKeyChange = (oldKey: string, newKey: string) => {
      if (oldKey === newKey) return;

      const newValue = { ...objectValue };
      const value = newValue[oldKey];
      delete newValue[oldKey];
      newValue[newKey] = value;
      onChange(fullPath, newValue);
    };

    const handleValueChange = (key: string, newValue: string) => {
      onChange(fullPath, { ...objectValue, [key]: newValue });
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={fullPath}>{field.title}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddKeyValue}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Key-Value
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{field.description}</p>

        <div className="space-y-2 pl-4 border-l-2 border-muted">
          {Object.entries(objectValue).map(([key, val], index) => (
            <div key={key} className="flex items-center gap-2">
              <Input
                value={key}
                onChange={(e) => handleKeyChange(key, e.target.value)}
                placeholder="Key"
                className="flex-1"
              />
              <Input
                value={val as string}
                onChange={(e) => handleValueChange(key, e.target.value)}
                placeholder="Value"
                className="flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveKeyValue(key)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {Object.keys(objectValue).length === 0 && (
            <p className="text-xs text-muted-foreground italic">
              No key-value pairs added
            </p>
          )}
        </div>
      </div>
    );
  }

  // Handle array fields
  if (field.type === "array") {
    // Ensure value is an array
    const arrayValue = Array.isArray(value) ? value : [];

    const handleAddItem = () => {
      // Create a new array with an empty string added
      const newArray = [...arrayValue, ""];

      // Log for debugging
      console.log(`Adding item to array at ${fullPath}`, {
        before: arrayValue,
        after: newArray,
        path: fullPath,
      });

      // Call the onChange handler with the updated array
      onChange(fullPath, newArray);
    };

    const handleRemoveItem = (index: number) => {
      const newArray = [...arrayValue];
      newArray.splice(index, 1);
      onChange(fullPath, newArray);
    };

    const handleItemChange = (index: number, newValue: string) => {
      const newArray = [...arrayValue];
      newArray[index] = newValue;
      onChange(fullPath, newArray);
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={fullPath}>{field.title}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddItem}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Item
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{field.description}</p>

        <div className="space-y-2 pl-4 border-l-2 border-muted">
          {arrayValue.length > 0 ? (
            arrayValue.map((item: any, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  id={`${fullPath}.${index}`}
                  value={item}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                  placeholder={`Item ${index + 1}`}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No items added
            </p>
          )}
        </div>
      </div>
    );
  }

  // Handle object fields
  if (field.type === "object") {
    const objectValue =
      typeof value === "object" && value !== null ? value : {};
    const hasEnabledField = field.properties && field.properties.enabled;
    const isEnabled = hasEnabledField ? objectValue.enabled : true;

    return (
      <div className="space-y-2">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4 mr-1" />
          ) : (
            <ChevronRight className="h-4 w-4 mr-1" />
          )}
          <Label htmlFor={fullPath} className="cursor-pointer">
            {field.title}
          </Label>

          {hasEnabledField && (
            <div className="ml-auto" onClick={(e) => e.stopPropagation()}>
              <Switch
                id={`${fullPath}.enabled`}
                checked={objectValue.enabled || false}
                onCheckedChange={(checked) => {
                  onChange(fullPath, { ...objectValue, enabled: checked });
                }}
              />
            </div>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{field.description}</p>

        {expanded && isEnabled && field.properties && (
          <div className="space-y-4 pl-4 border-l-2 border-muted pt-2">
            {Object.entries(field.properties).map(
              ([propKey, propField]: [string, any]) => {
                // Skip the enabled field as we're handling it separately
                if (propKey === "enabled" && hasEnabledField) return null;

                // Initialize the property value if it doesn't exist
                if (objectValue[propKey] === undefined) {
                  if (propField.type === "array") {
                    objectValue[propKey] = [];
                  } else if (propField.type === "object") {
                    objectValue[propKey] = {};
                  } else if (propField.type === "key_value") {
                    objectValue[propKey] = {};
                  }
                }

                return (
                  <NestedFormField
                    key={propKey}
                    fieldKey={propKey}
                    field={propField}
                    value={objectValue[propKey]}
                    onChange={(key, val) => {
                      // Create a new object to avoid mutating the original
                      const newObjectValue = { ...objectValue };

                      // Handle nested paths
                      const keyParts = key.split(".");
                      if (keyParts.length === 1) {
                        // Direct property update
                        newObjectValue[key] = val;
                      } else {
                        const lastKey = keyParts.pop()!;

                        // Set the value at the final level
                        newObjectValue[lastKey] = val;
                      }

                      // Update the parent with the new object
                      onChange(fullPath, newObjectValue);
                    }}
                    path={fullPath}
                  />
                );
              }
            )}
          </div>
        )}
      </div>
    );
  }

  // Handle basic field types
  switch (field.type) {
    case "input":
      return (
        <div className="space-y-2">
          <Label htmlFor={fullPath}>
            {field.title}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={fullPath}
            value={value || field.default || ""}
            onChange={(e) => onChange(fullPath, e.target.value)}
            placeholder={field.description}
            required={field.required}
          />
          <p className="text-xs text-muted-foreground">{field.description}</p>
        </div>
      );

    case "number":
      return (
        <div className="space-y-2">
          <Label htmlFor={fullPath}>
            {field.title}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Input
            id={fullPath}
            type="number"
            value={value ?? field.default ?? 0}
            onChange={(e) =>
              onChange(fullPath, Number.parseInt(e.target.value) || 0)
            }
            placeholder={field.description}
            required={field.required}
          />
          <p className="text-xs text-muted-foreground">{field.description}</p>
        </div>
      );

    case "bool":
      return (
        <div className="flex items-center justify-between space-y-0 py-4">
          <div className="space-y-0.5">
            <Label htmlFor={fullPath}>
              {field.title}
              {field.required && (
                <span className="text-destructive ml-1">*</span>
              )}
            </Label>
            <p className="text-xs text-muted-foreground">{field.description}</p>
          </div>
          <Switch
            id={fullPath}
            checked={value ?? field.default ?? false}
            onCheckedChange={(checked) => onChange(fullPath, checked)}
          />
        </div>
      );

    case "code":
      // Determine language based on field key
      let language = "bloblang";
      if (
        fieldKey === "headers" ||
        fieldKey === "claims" ||
        fieldKey === "endpoint_params"
      ) {
        language = "json";
      }

      return (
        <div className="space-y-2">
          <Label htmlFor={fullPath}>
            {field.title}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <CodeEditor
            id={fullPath}
            value={value || field.default || ""}
            onChange={(val) => onChange(fullPath, val)}
            placeholder={field.description}
            language={language}
            minHeight="150px"
          />
          <p className="text-xs text-muted-foreground">{field.description}</p>
        </div>
      );

    case "select":
      return (
        <div className="space-y-2">
          <Label htmlFor={fullPath}>
            {field.title}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          <Select
            value={value || field.default || ""}
            onValueChange={(val) => onChange(fullPath, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.title}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">{field.description}</p>
        </div>
      );

    default:
      return null;
  }
}
