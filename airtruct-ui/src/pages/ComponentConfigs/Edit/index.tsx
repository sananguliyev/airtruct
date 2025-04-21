import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../../ui/button";
import { Input } from "../../../ui/input";
import { Label } from "../../../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "../../../components/toast";
import { NestedFormField } from "../../../components/nested-form-field";
import { componentSchemas, componentLists } from "../../../lib/component-schemas";
import { ComponentConfig } from "../../../components/ComponentConfigs/types";

const EditPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { id } = useParams<{ id: string }>();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [componentSection, setComponentSection] = useState<string>("");
  const [selectedComponent, setSelectedComponent] = useState<string>("");
  const [configSchema, setConfigSchema] = useState<any>(null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [componentLoaded, setComponentLoaded] = useState(false);
  const [componentConfig, setComponentConfig] = useState<ComponentConfig | undefined>();

  const [formData, setFormData] = useState({
    name: "",
    section: "",
    component: "",
    config: {},
    created_at: "",
  });

  useEffect(() => {
    const fetchComponentConfig = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8080/component-configs/${id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch component config");
        }

        const data = await response.json();

        let formDataConfig = data.config[data.component] || {};
        const isFlat = componentSchemas[data.section as keyof typeof componentSchemas][
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
          created_at: data.created_at,
        });

        setComponentConfig(data);
        setComponentSection(data.section);
        setSelectedComponent(data.component);
        setConfigValues(formDataConfig);
        setComponentLoaded(true);
      } catch (error: any) {
        addToast({
          id: "fetch-error",
          title: "Error Fetching Component Config",
          description: error instanceof Error ? error.message : "An unknown error occurred",
          variant: "error",
        });
        navigate("/component-configs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponentConfig();
  }, [id, addToast, navigate]);

  useEffect(() => {
    const loadConfigSchema = () => {
      if (componentLoaded && componentSection && selectedComponent) {
        setIsLoading(true);

        try {
          const schema =
            componentSchemas[componentSection as keyof typeof componentSchemas][
              selectedComponent as keyof (typeof componentSchemas)[keyof typeof componentSchemas]
            ];
          setConfigSchema(schema);

          if (schema) {
            const initializedConfigValues = ensureNestedObjectsExist(configValues, schema);
            setConfigValues(initializedConfigValues);
          }
        } catch (error) {
          console.error("Error loading schema:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadConfigSchema();
  }, [componentSection, selectedComponent, componentLoaded, configValues]);

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

    const schema =
      componentSchemas[componentSection as keyof typeof componentSchemas][
        value as keyof (typeof componentSchemas)[keyof typeof componentSchemas]
      ];
    setConfigSchema(schema);

    const initialValues: Record<string, any> = {};
    initializeDefaultValues(schema, initialValues);
    setConfigValues(initialValues);
  };

  const initializeDefaultValues = (schema: any, values: Record<string, any>) => {
    Object.entries(schema).forEach(([key, field]: [string, any]) => {
      if (field.type === "object" && field.properties) {
        values[key] = {};
        initializeDefaultValues(field.properties, values[key]);
      } else if (field.type === "array") {
        values[key] = field.default || [];
      } else if (field.type === "key_value") {
        values[key] = field.default || {};
      } else if (field.default !== undefined) {
        values[key] = field.default;
      } else if (field.type === "bool") {
        values[key] = false;
      } else if (field.type === "number") {
        values[key] = 0;
      } else if (field.type === "code") {
        values[key] = "";
      } else {
        values[key] = "";
      }
    });
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfigValues((prev) => {
      const newValues = JSON.parse(JSON.stringify(prev));
      const keyParts = key.split(".");

      if (keyParts.length === 1) {
        newValues[key] = value;
      } else {
        let current = newValues;

        for (let i = 0; i < keyParts.length - 1; i++) {
          const part = keyParts[i];

          if (current[part] === undefined) {
            if (i < keyParts.length - 2) {
              const nextPart = keyParts[i + 1];
              if (!isNaN(Number(nextPart))) {
                current[part] = [];
              } else {
                current[part] = {};
              }
            } else {
              current[part] = {};
            }
          }

          current = current[part];
        }

        const lastKey = keyParts[keyParts.length - 1];
        current[lastKey] = value;
      }

      return newValues;
    });
  };

  const ensureNestedObjectsExist = (configValues: any, schema: any) => {
    if (!schema) return configValues;

    const result = { ...configValues };

    Object.entries(schema).forEach(([key, field]: [string, any]) => {
      if (field.type === "object" && field.properties) {
        if (!result[key] || typeof result[key] !== "object") {
          result[key] = {};
        }

        result[key] = ensureNestedObjectsExist(result[key], field.properties);
      } else if (field.type === "array") {
        if (!Array.isArray(result[key])) {
          result[key] = [];
        }
      } else if (
        field.type === "key_value" &&
        (!result[key] || typeof result[key] !== "object")
      ) {
        result[key] = {};
      }
    });

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let formDataConfig = { [formData.component]: configValues };
      const isFlat =
        componentSchemas[componentSection as keyof typeof componentSchemas][
          formData.component as keyof (typeof componentSchemas)[keyof typeof componentSchemas]
        ]["flat"] ?? false;
      if (isFlat) {
        formDataConfig = configValues;
      }
      const updatedFormData = {
        ...formData,
        config: formDataConfig,
      };

      const response = await fetch(
        `http://localhost:8080/component-configs/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedFormData),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create component config: ${response.statusText}`
        );
      }

      addToast({
        id: "component-config-created",
        title: "Component Config Created",
        description: `${formData.name} has been created successfully.`,
        variant: "success",
      });

      navigate("/component-configs");
    } catch (error: any) {
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
};

export default EditPage;
