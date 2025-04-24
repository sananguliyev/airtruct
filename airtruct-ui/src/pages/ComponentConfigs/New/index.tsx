// src/pages/ComponentConfigs/NewPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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

const NewPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

//   const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [componentSection, setComponentSection] = useState("");
  const [selectedComponent, setSelectedComponent] = useState("");
  const [configSchema, setConfigSchema] = useState<any>(null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});

  const [formData, setFormData] = useState({
    name: "",
    section: "",
    component: "",
    config: {},
  });

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

    const schema = componentSchemas[componentSection as keyof typeof componentSchemas][
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
            current[part] = {};
          }
          current = current[part];
        }
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
      const isFlat =
        componentSchemas[componentSection as keyof typeof componentSchemas][
          formData.component as keyof (typeof componentSchemas)[keyof typeof componentSchemas]
        ]?.["flat"] ?? false;
      if (isFlat) {
        formDataConfig = configValues;
      }

      const response = await fetch("http://localhost:8080/component-configs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          config: formDataConfig,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create component: ${response.statusText}`);
      }

      addToast({
        id: "component-config-created",
        title: "Component Created",
        description: `${formData.name} has been created successfully.`,
        variant: "success",
      });

      navigate("/component-configs");
    } catch (error: any) {
      addToast({
        id: "component-config-error",
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
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
        <p className="text-muted-foreground">Create new component configuration with detailed settings</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
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
              <Select value={componentSection} onValueChange={handleSectionChange} required>
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
          </CardContent>
        </Card>

        {selectedComponent && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedComponent} Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {configSchema ? (
                <div className="space-y-6">
                  {Object.entries(configSchema).map(([key, field]: [string, any]) => (
                    <NestedFormField
                      key={key}
                      fieldKey={key}
                      field={field}
                      value={configValues[key]}
                      onChange={handleConfigChange}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
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
            disabled={!formData.name || !componentSection || !selectedComponent || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Component"
            )}
          </Button>
        </div>
      </form>
    </div>

  );
};

export default NewPage;
