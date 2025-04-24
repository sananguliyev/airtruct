import type React from 'react';
import { Stream } from "@/lib/entities";

// Placeholder columns definition - adapt based on original logic
export const columns = (handleRowClick: (stream: Stream) => void) => [
  {
    key: "name" as keyof Stream,
    title: "Name",
    render: (value: string, row: Stream) => (
      <button onClick={() => handleRowClick(row)} className="text-blue-600 hover:underline">
        {value}
      </button>
    ),
  },
  // Add other columns (status, input, output, createdAt etc.) based on requirements
  // Make sure to handle rendering (e.g., badges for status)
  { key: "status" as keyof Stream, title: "Status" }, 
  { key: "inputLabel" as keyof Stream, title: "Input" },
  { key: "outputLabel" as keyof Stream, title: "Output" },
  { key: "createdAt" as keyof Stream, title: "Created At" },
]; 