"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useNavigate } from "react-router-dom";
import { columns } from "@/components/component-config-columns";
import { deleteComponentConfig, fetchComponentConfigs } from "@/lib/api";
import { ComponentConfig } from "@/lib/entities";
import { useToast } from "@/components/toast";

export default function ComponentsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [componentConfigs, setComponentConfigs] = useState<ComponentConfig[]>(
    [] as ComponentConfig[]
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfigs = async () => {
      try {
        setLoading(true);
        const data = await fetchComponentConfigs();
        setComponentConfigs(data);
        setError(null);
      } catch (err) {
        addToast({
          id: "component-config-error",
          title: "Error Listing Component Config",
          description:
            err instanceof Error
              ? err.message
              : "An unknown error occurred",
          variant: "error",
        });
        setError("Failed to fetch component configurations");
      } finally {
        setLoading(false);
      }
    };
    loadConfigs();
  }, []);

  const handleAddNew = () => {
    navigate("/component-configs/new");
  };

  const handleEdit = (componentConfig: ComponentConfig) => {
    navigate(`/component-configs/${componentConfig.id}/edit`);
  };

  const handleDelete = async (componentConfig: ComponentConfig) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete ${componentConfig.name}?`
    );
    if (confirmDelete) {
      try {
        await deleteComponentConfig(componentConfig.id);
        setComponentConfigs((prevConfigs) =>
          prevConfigs.filter((config) => config.id !== componentConfig.id)
        );
        addToast({
          id: "component-config-deleted",
          title: "Component Config Deleted",
          description: "The component config has been deleted successfully",
          variant: "success",
        });
      } catch (err) {
        addToast({
          id: "component-config-error",
          title: "Error Deleting Component Config",
          description: err instanceof Error ? err.message : "An unknown error occurred",
          variant: "error",
        });
      }
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Component Configs</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          Add New
        </Button>
      </div>

      {loading ? (
        <p>Loading configurations...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <DataTable
          data={componentConfigs}
          columns={columns()}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
