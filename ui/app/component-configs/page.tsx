"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/data-table";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

import { ComponentConfig } from "@/lib/entities";
import { useToast } from "@/components/toast";

export default function ComponentsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [componentConfigs, setComponentConfigs] = useState<ComponentConfig[]>(
    [] as ComponentConfig[]
  );

  useEffect(() => {
    async function fetchComponentConfigs() {
      try {
        const response = await fetch("http://localhost:8080/component-configs");

        if (!response.ok) {
          throw new Error("Response not ok");
        }
        const data = await response.json();
        setComponentConfigs(
          data.map((componentConfig: any) => ({
            id: componentConfig.id,
            name: componentConfig.name,
            section: componentConfig.section,
            component: componentConfig.component,
            createdAt: new Date(componentConfig.created_at).toLocaleString(),
            updatedAt: new Date(componentConfig.updated_at).toLocaleString(),
          }))
        );
      } catch (error) {
        addToast({
          id: "component-config-error",
          title: "Error Listing Component Config",
          description:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
          variant: "error",
        });
      }
    }

    fetchComponentConfigs();
  }, []);

  const columns = [
    // { key: "id", title: "ID" },
    { key: "name", title: "Name" },
    {
      key: "section",
      title: "Section",
      render: (value: string) => {
        const colorMap: Record<string, string> = {
          input:
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          processor:
            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
          output:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        };
        return (
          <Badge className={colorMap[value] || ""} variant="outline">
            {value}
          </Badge>
        );
      },
    },
    {
      key: "component",
      title: "Component",
      render: (value: string) => <Badge variant="outline">{value}</Badge>,
    },
    {
      key: "createdAt",
      title: "Last versioned at",
    },
  ];

  const handleAddNew = () => {
    router.push("/component-configs/new");
  };

  const handleEdit = (componentConfig: ComponentConfig) => {
    router.push(`/component-configs/${componentConfig.id}/edit`);
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

      <DataTable
        data={componentConfigs}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
