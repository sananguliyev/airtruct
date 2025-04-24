import type React from 'react';
import { ComponentConfig } from "@/lib/entities";
import { Badge } from './ui/badge';

export const columns = () => [
  { key: "name" as keyof ComponentConfig, title: "Name" },
  {
    key: "section" as keyof ComponentConfig,
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
    key: "component" as keyof ComponentConfig,
    title: "Component",
    render: (value: string) => <Badge variant="outline">{value}</Badge>,
  },
  { key: "createdAt" as keyof ComponentConfig, title: "Last versioned at" },
]; 