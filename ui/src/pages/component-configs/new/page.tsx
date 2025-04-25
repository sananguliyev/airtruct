import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/toast";
import { NestedFormField } from "@/components/nested-form-field";
import { componentSchemas, componentLists } from "@/lib/component-schemas";
import { createComponentConfig } from "@/lib/api";
import { initializeDefaultValues, ensureNestedObjectsExist } from "@/components/component-config-helper";

export default function NewComponentConfigPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [componentSection, setComponentSection] = useState<string>("");
  const [selectedComponent, setSelectedComponent] = useState<
    keyof (typeof componentSchemas)[keyof typeof componentSchemas] | ""
  >("");
  const [configSchema, setConfigSchema] = useState<any>(null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    name: "",
    section: "",
    component: "",
    config: {},
  });

  // Update available components when type changes
  useEffect(() => {
    if (componentSection) {
      setFormData((prev) => ({ ...prev, section: componentSection }));
      setSelectedComponent("");
      setConfigSchema(null);
      setConfigValues({});
    }
  }, [componentSection]);

  // Update config schema when component changes
  useEffect(() => {
    if (componentSection && selectedComponent) {
      setFormData((prev) => ({ ...prev, component: selectedComponent }));

      // Simulate loading the schema
      setIsLoading(true);
      setTimeout(() => {
        const schema =
          componentSchemas[componentSection as keyof typeof componentSchemas][
            selectedComponent as keyof (typeof componentSchemas)[keyof typeof componentSchemas]
          ];
        setConfigSchema(schema);

        // Initialize config values with defaults
        const initialValues: Record<string, any> = {};
        initializeDefaultValues(schema, initialValues);

        // Ensure all nested objects exist
        const initializedValues = ensureNestedObjectsExist(
          initialValues,
          schema
        );
        setConfigValues(initializedValues);

        setIsLoading(false);
      }, 500);
    }
  }, [selectedComponent, componentSection]);

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleConfigChange = (key: string, value: any) => {
    console.log(`Changing ${key} to:`, value); // Debug log
  
    setConfigValues((prev) => {
      // Create a deep copy to avoid mutation issues
      const newValues = JSON.parse(JSON.stringify(prev));
  
      // Handle nested paths
      const keyParts = key.split(".");
  
      console.log("Key parts:", keyParts); // Debug log
  
      if (keyParts.length === 1) {
        // Simple case: top-level property
        newValues[key] = value;
      } else {
        // Complex case: nested property
        let current = newValues;
  
        // Navigate to the parent object
        for (let i = 0; i < keyParts.length; i++) {
          const part = keyParts[i];
  
          // Ensure the path exists
          if (current[part] === undefined) {
            // Initialize based on the next part in the path
            if (i < keyParts.length - 2) {
              const nextPart = keyParts[i + 1];
              // If the next part is a number, initialize as array
              if (!isNaN(Number(nextPart))) {
                current[part] = [];
              } else {
                current[part] = {};
              }
            } else {
              // Last level before the value, initialize as object
              current[part] = {};
            }
          }
  
          // Move to the next level
          current = current[part];
        }
  
        // Set the value at the final level
        const lastKey = keyParts[keyParts.length - 1];
        current[lastKey] = value;
      }
  
      console.log("Updated config values:", JSON.stringify(newValues, null, 2)); // More detailed debug log
      return newValues;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let formDataConfig = { [formData.component]: configValues };
      let isFlat =
        componentSchemas[componentSection as keyof typeof componentSchemas][
          formData.component as keyof (typeof componentSchemas)[keyof typeof componentSchemas]
        ]["flat"] ?? false;
      if (isFlat) {
        formDataConfig = configValues;
      } 
      const updatedComponentConfig = {
        name: formData.name,
        section: formData.section,
        component: formData.component,
        config: formDataConfig,
      };

      const response = await createComponentConfig(updatedComponentConfig);

      // Show success toast
      addToast({
        id: "component-config-created",
        title: "Component Config Created",
        description: `${formData.name} has been created successfully.`,
        variant: "success",
      });

      // Navigate back to the component configs list
      navigate("/component-configs");
    } catch (error) {
      // Show error toast
      addToast({
        id: "component-config-error",
        title: "Error Creating Component Config",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Add New Component Config</h1>
        <p className="text-muted-foreground">
          Create a new component configuration with detailed settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleBasicChange}
                placeholder="Component config name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select
                value={componentSection}
                onValueChange={setComponentSection}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select component section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="input">Input</SelectItem>
                  <SelectItem value="pipeline">Pipeline</SelectItem>
                  <SelectItem value="output">Output</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {componentSection && (
              <div className="space-y-2">
                <Label htmlFor="component">Component</Label>
                <Select
                  value={selectedComponent}
                  onValueChange={(value) =>
                    setSelectedComponent(
                      value as keyof (typeof componentSchemas)[keyof typeof componentSchemas]
                    )
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select component" />
                  </SelectTrigger>
                  <SelectContent>
                    {componentLists[
                      componentSection as keyof typeof componentLists
                    ].map((comp) => (
                      <SelectItem key={comp} value={comp}>
                        {comp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedComponent && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedComponent} Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : configSchema ? (
                <div className="space-y-6">
                  {Object.entries(configSchema).map(
                    ([key, field]: [string, any]) => (
                      <NestedFormField
                        key={key}
                        fieldKey={key}
                        field={field}
                        value={configValues[key]}
                        onChange={handleConfigChange}
                      />
                    )
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground py-4">
                  Select a component to configure
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              !formData.name ||
              !componentSection ||
              !selectedComponent ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Component Config"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
