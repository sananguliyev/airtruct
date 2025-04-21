import { ComponentSchema } from "../types";

export const initializeDefaultValues = (
  schema: ComponentSchema,
  values: Record<string, any>
): void => {
  Object.entries(schema).forEach(([key, field]) => {
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
    } else {
      values[key] = "";
    }
  });
};

export const ensureNestedObjectsExist = (
  configValues: Record<string, any>,
  schema: ComponentSchema
): Record<string, any> => {
  const result = { ...configValues };

  Object.entries(schema).forEach(([key, field]) => {
    if (field.type === "object" && field.properties) {
      if (!result[key] || typeof result[key] !== "object") {
        result[key] = {};
      }

      result[key] = ensureNestedObjectsExist(result[key], field.properties);
    } else if (field.type === "array" && !Array.isArray(result[key])) {
      result[key] = [];
    } else if (
      field.type === "key_value" &&
      (!result[key] || typeof result[key] !== "object")
    ) {
      result[key] = {};
    }
  });

  return result;
};
