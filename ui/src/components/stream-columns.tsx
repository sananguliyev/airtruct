import type React from 'react';
import { Stream } from "@/lib/entities";
import { Badge } from './ui/badge';

export const columns = () => [
  { key: "name" as keyof Stream, title: "Name" },
  { 
    key: "status" as keyof Stream, title: "Status", 
    render: (value: string) => {
      const colorMap: Record<string, string> = {
        active:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        completed:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        paused:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        failed:
          "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      };
      return (
        <Badge className={colorMap[value] || ""} variant="outline">
          {value}
        </Badge>
      );
    }, 
  }, 
  { key: "inputLabel" as keyof Stream, title: "Input" },
  { key: "outputLabel" as keyof Stream, title: "Output" },
  { key: "createdAt" as keyof Stream, title: "Created At" },
]; 