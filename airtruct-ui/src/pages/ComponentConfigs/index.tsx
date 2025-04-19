import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "../../ui/button";
import { useNavigate } from "react-router-dom";
import { Badge } from "../../ui/badge";
import { ComponentConfig } from "../../components/ComponentConfigs/types";
import { DataTable } from "../../components/dataTable";
import { Column } from "../../components/dataTable";


const ComponentConfigsPage = () => {
  const navigate = useNavigate();
  const [componentConfigs, setComponentConfigs] = useState<ComponentConfig[]>([]);

  useEffect(() => {
    async function fetchComponentConfigs() {
      try {
        const response = await fetch("http://localhost:8080/component-configs");

        if (!response.ok) {
          throw new Error("Response not ok");
        }

        const data = await response.json();
        setComponentConfigs(
          data.map((item: any) => ({
            id: item.id,
            name: item.name,
            section: item.section,
            component: item.component,
            createdAt: new Date(item.created_at).toLocaleString(),
            updatedAt: new Date(item.updated_at).toLocaleString(),
          }))
        );
      } catch (error) {
        console.error("Error fetching component configs:", error);
        // Optional: toast/error UI
      }
    }

    fetchComponentConfigs();
  }, []);

  const handleAddNew = () => navigate("/component-configs/new");
  const handleEdit = (item: ComponentConfig) => navigate(`/component-configs/${item.id}/edit`);
  const handleDelete = (item: ComponentConfig) => {
    if (confirm(`Are you sure you want to delete ${item.name}?`)) {
      fetch(`http://localhost:8080/component-configs/${item.id}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Response not ok");
          }
          setComponentConfigs((prev) =>
            prev.filter((config) => config.id !== item.id)
          );
        })
        .catch((error) => {
          console.error("Error deleting component config:", error);
        });
    }
  };

  const columns: Column<ComponentConfig>[] = [
    { key: "name", title: "Name" },
    {
      key: "section",
      title: "Section",
      render: (value: string) => {
        const colorMap: Record<string, string> = {
          input: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
          processor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
          output: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
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
  ] as Column<ComponentConfig>[];;

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
};

export default ComponentConfigsPage;
