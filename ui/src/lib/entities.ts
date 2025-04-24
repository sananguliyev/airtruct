export type Worker = {
  id: string;
  status: string;
  address: string;
  lastHeartbeat: string;
  activeStreams: number;
};

export type ComponentConfig = {
  id: string;
  name: string;
  type: string;
  section: string;
  component: string;
  createdAt: string;
};

export type Stream = {
  id: string;
  name: string;
  status: string;
  inputLabel: string;
  inputID: string;
  input: string;
  output: string;
  outputID: string;
  outputLabel: string;
  processors: StreamProcessor[];
  createdAt: string;

  visualData: {};
};

export type StreamProcessor = {
  id: string;
  processorID: string;
  processor: ComponentConfig;
  label: string;
  createdAt: string;
};
