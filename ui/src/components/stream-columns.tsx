import type React from 'react';
import { Stream } from "@/lib/entities";

export const columns = () => [
  { key: "name" as keyof Stream, title: "Name" },
  { key: "status" as keyof Stream, title: "Status" }, 
  { key: "inputLabel" as keyof Stream, title: "Input" },
  { key: "outputLabel" as keyof Stream, title: "Output" },
  { key: "createdAt" as keyof Stream, title: "Created At" },
]; 