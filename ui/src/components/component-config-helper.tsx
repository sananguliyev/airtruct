import type React from 'react';
import { ComponentConfig } from "@/lib/entities";
import { Badge } from './ui/badge';

// Update the initializeDefaultValues function to properly handle arrays
export const initializeDefaultValues = (
  schema: any,
  values: Record<string, any>
) => {
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

// Helper function to ensure nested objects are properly initialized
export const ensureNestedObjectsExist = (configValues: any, schema: any) => {
  if (!schema) return configValues;

  const result = { ...configValues };

  Object.entries(schema).forEach(([key, field]: [string, any]) => {
    // If it's an object with properties, ensure the object exists
    if (field.type === "object" && field.properties) {
      if (!result[key] || typeof result[key] !== "object") {
        result[key] = {};
      }

      // Recursively ensure nested objects exist
      result[key] = ensureNestedObjectsExist(result[key], field.properties);
    }
    // If it's an array and doesn't exist, initialize it
    else if (field.type === "array") {
      if (!Array.isArray(result[key])) {
        result[key] = [];
      }
    }
    // If it's a key-value object and doesn't exist, initialize it
    else if (
      field.type === "key_value" &&
      (!result[key] || typeof result[key] !== "object")
    ) {
      result[key] = {};
    }
  });

  return result;
};