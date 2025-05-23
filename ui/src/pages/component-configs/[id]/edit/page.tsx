import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { ComponentConfig } from "@/lib/entities";
import { fetchComponentConfig, updateComponentConfig } from "@/lib/api";
import { initializeDefaultValues, ensureNestedObjectsExist } from "@/components/component-config-helper";

export default function ComponentConfigEditPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [componentSection, setComponentSection] = useState<string>("");
  const [selectedComponent, setSelectedComponent] = useState<string>("");
  const [configSchema, setConfigSchema] = useState<any>(null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [componentLoaded, setComponentLoaded] = useState(false);
  const [componentConfig, setComponentConfig] = useState<ComponentConfig>();

  const [formData, setFormData] = useState({
    name: "",
    section: "",
    component: "",
    config: {},
    created_at: "",
  });

  // Load component data
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const data = await fetchComponentConfig(id || "");
        setComponentConfig(data);
        setComponentSection(data.section);
        setSelectedComponent(data.component);
        let formDataConfig = data.config[data.component] || {};
        let isFlat =
          componentSchemas[data.section as keyof typeof componentSchemas][
            data.component as keyof (typeof componentSchemas)[keyof typeof componentSchemas]
          ]["flat"] ?? false;
        if (isFlat) {
          formDataConfig = data.config;
        }
        setFormData({
          name: data.name,
          section: data.section,
          component: data.component,
          config: formDataConfig,
          created_at: data.createdAt,
        });
        setConfigValues(formDataConfig);
        setComponentLoaded(true);
      } catch (err) {
        addToast({
          id: "component-config-error",
          title: "Error Fetching Component Config",
          description:
            err instanceof Error
              ? err.message
              : "An unknown error occurred",
          variant: "error",
        });
        navigate("/component-configs");
      } finally {
        setIsLoading(false);
      }
    };
    loadConfig();
  }, [id]);

  // Load config schema when component type and selected component are set
  useEffect(() => {
    if (componentLoaded && componentSection && selectedComponent) {
      setIsLoading(true);

      // Get schema for the selected component
      try {
        const schema =
          componentSchemas[componentSection as keyof typeof componentSchemas][
            selectedComponent as keyof (typeof componentSchemas)[keyof typeof componentSchemas]
          ];
        setConfigSchema(schema);

        // Ensure all nested objects exist in the config values
        if (schema) {
          const initializedConfigValues = ensureNestedObjectsExist(
            configValues,
            schema
          );
          setConfigValues(initializedConfigValues);
        }
      } catch (error) {
        console.error("Error loading schema:", error);
      }

      setIsLoading(false);
    }
  }, [componentSection, selectedComponent, componentLoaded]);

  const handleBasicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSectionChange = (value: string) => {
    setComponentSection(value);
    setFormData((prev) => ({ ...prev, section: value }));
    setSelectedComponent("");
    setConfigSchema(null);
    setConfigValues({});
  };

  const handleComponentChange = (value: string) => {
    setSelectedComponent(value);
    setFormData((prev) => ({ ...prev, component: value }));

    // Load schema for the new component
    const schema =
      componentSchemas[componentSection as keyof typeof componentSchemas][
        value as keyof (typeof componentSchemas)[keyof typeof componentSchemas]
      ];
    setConfigSchema(schema);

    // Initialize config values with defaults
    const initialValues: Record<string, any> = {};
    initializeDefaultValues(schema, initialValues);
    setConfigValues(initialValues);
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfigValues((prev) => {
      // Create a deep copy to avoid mutation issues
      const newValues = JSON.parse(JSON.stringify(prev));

      // Handle nested paths
      const keyParts = key.split(".");

      if (keyParts.length === 1) {
        // Simple case: top-level property
        newValues[key] = value;
      } else {
        // Complex case: nested property
        let current = newValues;

        // Navigate to the parent object
        for (let i = 0; i < keyParts.length - 1; i++) {
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

      const response = await updateComponentConfig(id || "", updatedComponentConfig);

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
        title: "Error Updating Component Config",
        description:
          error instanceof Error ? error.message : "An unknown error occurred",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!componentLoaded) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Component Config</h1>
        <p className="text-muted-foreground">Update component configuration</p>
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
                onValueChange={handleSectionChange}
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
                  onValueChange={handleComponentChange}
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

            <div className="text-sm text-muted-foreground">
              Created: {new Date(formData.created_at).toLocaleString()}
            </div>
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
                  Loading configuration...
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => navigate("/component-configs")}>
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
                Updating...
              </>
            ) : (
              "Update Component Config"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
