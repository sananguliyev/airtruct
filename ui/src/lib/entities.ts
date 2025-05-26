import type { Node, Edge } from "reactflow";

export type Worker = {
  id: string;
  status: string;
  address: string;
  lastHeartbeat: string;
  activeStreams: number;
  createdAt: string;
};

export type ComponentConfig = {
  id: string;
  name: string;
  type: string;
  section: string;
  component: string;
  createdAt: string;
  config: Record<string, any>;
};

export type Stream = {
  id: string;
  parentID?: string;
  name: string;
  status: string;
  input_label: string;
  input_component: string;
  input_config: string;
  output_label: string;
  output_component: string;
  output_config: string;
  processors: Array<{
    label: string;
    component: string;
    config: string;
  }>;
  createdAt: string;
  is_http_server: boolean;

  // Legacy fields for backward compatibility
  inputLabel?: string;
  inputID?: number;
  input?: string;
  output?: string;
  outputID?: number;
  outputLabel?: string;
  isHttpServer?: boolean;

  visualData?: {
    nodes: Node[];
    edges: Edge[];
  };
};

export type StreamProcessor = {
  processorID: number;
  label: string;
};
