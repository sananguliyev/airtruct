"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useNavigate } from "react-router-dom";
import { columns } from "@/components/component-config-columns";

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
        const response = await fetch("http://localhost:8080/v0/component-configs");

        if (!response.ok) {
          throw new Error("Response not ok");
        }
        const data = await response.json();
        setComponentConfigs(
          data.data.map((componentConfig: any) => ({
            id: componentConfig.id,
            name: componentConfig.name,
            section: componentConfig.section,
            component: componentConfig.component,
            createdAt: new Date(componentConfig.created_at).toLocaleString(),
            updatedAt: new Date(componentConfig.updated_at).toLocaleString(),
          }))
        );
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

  const handleDelete = (componentConfig: ComponentConfig) => {
    const confirmDelete = confirm(
      `Are you sure you want to delete ${componentConfig.name}?`
    );
    if (confirmDelete) {
      fetch(`http://localhost:8080/component-configs/${componentConfig.id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Response not ok");
          }
          setComponentConfigs((prevConfigs) =>
            prevConfigs.filter((config) => config.id !== componentConfig.id)
          );
        })
        .catch((error) => {
          console.error("Error deleting component config:", error);
        });
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
