export type Worker = {
  id: string;
  status: string;
  address: string;
  lastHeartbeat: string;
  activeStreams: number;
  createdAt: string;
};

export type Secret = {
  key: string;
  createdAt: string;
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
  buffer_id?: number;
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
};

export type StreamProcessor = {
  processorID: number;
  label: string;
};

export type Cache = {
  id: string;
  parentID?: string;
  label: string;
  component: string;
  config: string;
  createdAt: string;
};

export type RateLimit = {
  id: string;
  parentID?: string;
  label: string;
  component: string;
  config: string;
  createdAt: string;
};

export type Buffer = {
  id: string;
  parentID?: string;
  label: string;
  component: string;
  config: string;
  createdAt: string;
};

export type StreamEvent = {
  id: number;
  worker_stream_id: number;
  flow_id: string;
  section: string;
  component_label: string;
  type: string;
  content: string;
  meta: Record<string, any>;
  created_at: string;
};
