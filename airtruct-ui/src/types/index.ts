export const componentSchemas = {
    input: {
      generate: {
        mapping: { type: "string", title: "Mapping", description: "Mapping" },
        interval: {
          type: "string",
          title: "Interval",
          description: "Interval",
          default: "1s",
        },
      },
    },
  };
  export interface ComponentSchemaField {
    type: string;
    properties?: ComponentSchema;
    default?: any;
    flat?: boolean;
    [key: string]: any;
  }
  
  export type ComponentSchema = Record<string, ComponentSchemaField>;
  
  export interface ComponentConfig {
    name: string;
    section: string;
    component: string;
    config: Record<string, any>;
    created_at: string;
  }