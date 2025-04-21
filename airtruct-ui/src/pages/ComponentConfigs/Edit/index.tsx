// src/pages/ComponentConfigs/Edit/index.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useToast } from "../../../components/toast";
import BasicInfoCard from "../../../components/ComponentConfigs/BasicInfoCard";
import ConfigFormCard from "../../../components/ComponentConfigs/ConfigFormCard";
import ActionButtons from "../../../components/ComponentConfigs/ActionButtons";

import { componentSchemas } from "../../../lib/component-schemas";
import {
  initializeDefaultValues,
  ensureNestedObjectsExist,
} from "../../../lib/component-utils";
import { ComponentSchema, ComponentConfig } from "../../../types";

const EditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [componentSection, setComponentSection] = useState("");
  const [selectedComponent, setSelectedComponent] = useState("");
  const [configSchema, setConfigSchema] = useState<ComponentSchema | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, any>>({});
  const [componentLoaded, setComponentLoaded] = useState(false);

  const [formData, setFormData] = useState<ComponentConfig>({
    name: "",
    section: "",
    component: "",
    config: {},
    created_at: "",
  });

  useEffect(() => {
    const fetchComponentConfig = async () => {
      let data: { config: any; section: string; component: string; name: string; created_at: string };
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:8080/component-configs/${id}`);
        if (!response.ok) throw new Error("Failed to fetch component config");

         data = await response.json();
        let formDataConfig = data.config[data.component] || {};
        const isFlat = componentSchemas[data.section as keyof ComponentSchema][data.component as keyof ComponentSchema[data.section]]?.flat ?? false;
        if (isFlat) formDataConfig = data.config;

        setFormData({
          name: data.name,
          section: data.section,
          component: data.component,
          config: formDataConfig,
          created_at: data.created_at,
        });

        setComponentSection(data.section);
        setSelectedComponent(data.component);
        setConfigValues(formDataConfig);
        setComponentLoaded(true);
      } catch (error: any) {
        addToast({
          id: "fetch-error",
          title: "Error Fetching Component Config",
          description: error?.message ?? "An unknown error occurred",
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
    if (componentLoaded && componentSection && selectedComponent) {
      setIsLoading(true);
      try {
        const schema = componentSchemas[componentSection][selectedComponent];
        setConfigSchema(schema);
        const initialized = ensureNestedObjectsExist(configValues, schema);
        setConfigValues(initialized);
      } catch (error) {
        console.error("Error loading schema:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [componentLoaded, componentSection, selectedComponent, configValues]);

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

    const schema = componentSchemas[componentSection][value];
    setConfigSchema(schema);

    const initialValues: Record<string, any> = {};
    initializeDefaultValues(schema, initialValues);
    setConfigValues(initialValues);
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfigValues((prev) => {
      const updated = structuredClone(prev);
      const keys = key.split(".");
      let ref = updated;

      keys.slice(0, -1).forEach((part, i) => {
        if (!ref[part]) {
          const next = keys[i + 1];
          ref[part] = isNaN(Number(next)) ? {} : [];
        }
        ref = ref[part];
      });

      ref[keys.at(-1)!] = value;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const schema = componentSchemas[componentSection][formData.component];
      const isFlat = schema?.flat ?? false;
      const finalConfig = isFlat ? configValues : { [formData.component]: configValues };

      const response = await fetch(
        `http://localhost:8080/component-configs/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, config: finalConfig }),
        }
      );

      if (!response.ok) throw new Error("Failed to update component config");

      addToast({
        id: "component-config-updated",
        title: "Success",
        description: `${formData.name} has been updated.`,
        variant: "success",
      });

      navigate("/component-configs");
    } catch (error: any) {
      addToast({
        id: "component-config-error",
        title: "Update Error",
        description: error?.message ?? "An unknown error occurred",
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
        <BasicInfoCard
          formData={formData}
          componentSection={componentSection}
          selectedComponent={selectedComponent}
          handleBasicChange={handleBasicChange}
          handleSectionChange={handleSectionChange}
          handleComponentChange={handleComponentChange}
        />

        {selectedComponent && configSchema && (
          <ConfigFormCard
            isLoading={isLoading}
            configSchema={configSchema}
            configValues={configValues}
            handleConfigChange={handleConfigChange}
          />
        )}

        <ActionButtons
          isSubmitting={isSubmitting}
          onCancel={() => navigate(-1)}
          disabled={
            !formData.name || !componentSection || !selectedComponent || isSubmitting
          }
        />
      </form>
    </div>
  );
};

export default EditPage;
