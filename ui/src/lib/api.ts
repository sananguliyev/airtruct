import { Stream, ComponentConfig, Worker } from "./entities";

// Placeholder API functions - adapt based on original logic and backend
const API_BASE_URL = "http://localhost:8080/api/v0";

export async function fetchWorkers(): Promise<Worker[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/workers/all`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return data.data.map((worker: any) => ({
      id: worker.id,
      status: worker.status,
      address: worker.address || "N/A",
      lastHeartbeat: worker.last_heartbeat
        ? new Date(worker.last_heartbeat).toLocaleString()
        : "N/A",
      activeStreams: worker.active_streams || 0,
      createdAt: worker.created_at
        ? new Date(worker.created_at).toLocaleString()
        : "N/A",
    }));
  } catch (error) {
    console.error("Error fetching workers:", error);
    throw error;
  }
}

export async function fetchStreams(): Promise<Stream[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/streams?status=all`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return data?.data.map((stream: any) => ({
      id: stream.id,
      parentID: stream.parent_id || stream.id,
      name: stream.name,
      status: stream.status,
      input_label: stream.input_label,
      input_component: stream.input_component,
      input_config: stream.input_config || "",
      output_label: stream.output_label,
      output_component: stream.output_component,
      output_config: stream.output_config || "",
      processors: stream.processors?.map((processor: any) => ({
        label: processor.label,
        component: processor.component,
        config: processor.config || "",
      })) || [],
      createdAt: new Date(stream.created_at).toLocaleString(),
      is_http_server: stream.is_http_server || false,
    }));
  } catch (error) {
    console.error("Error fetching streams:", error);
    throw error; // Re-throw error to be handled by the calling component
  }
}

export async function fetchStream(id: string): Promise<Stream> {
  try {
    const response = await fetch(`${API_BASE_URL}/streams/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      id: data.data.id,
      parentID: data.data.parent_id || data.data.id,
      name: data.data.name,
      status: data.data.status,
      input_label: data.data.input_label,
      input_component: data.data.input_component,
      input_config: data.data.input_config || "",
      output_label: data.data.output_label,
      output_component: data.data.output_component,
      output_config: data.data.output_config || "",
      processors: data.data.processors?.map((processor: any) => ({
        label: processor.label,
        component: processor.component,
        config: processor.config || "",
      })) || [],
      createdAt: new Date(data.data.created_at).toLocaleString(),
      is_http_server: data.data.is_http_server || false,
    };
  } catch (error) {
    console.error("Error fetching stream:", error);
    throw error;
  }
}

export async function createStream(
  stream: {
    name: string;
    status: string;
    input_component: string;
    input_label: string;
    input_config: string;
    output_component: string;
    output_label: string;
    output_config: string;
    processors: Array<{
      label: string;
      component: string;
      config: string;
    }>;
  }
): Promise<Stream> {
  try {
    const response = await fetch(`${API_BASE_URL}/streams`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: stream.name,
        status: stream.status,
        input_component: stream.input_component,
        input_label: stream.input_label,
        input_config: stream.input_config,
        output_component: stream.output_component,
        output_label: stream.output_label,
        output_config: stream.output_config,
        processors: stream.processors.map((processor) => ({
          label: processor.label,
          component: processor.component,
          config: processor.config,
        })),
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      id: data.data.id,
      parentID: data.data.parent_id || data.data.id,
      name: data.data.name,
      status: data.data.status,
      input_label: data.data.input_label,
      input_component: data.data.input_component,
      input_config: data.data.input_config,
      output_label: data.data.output_label,
      output_component: data.data.output_component,
      output_config: data.data.output_config,
      processors:
        data.data.processors?.map((processor: any) => ({
          processorID: processor.processor_id,
          label: processor.label,
        })) || [],
      createdAt: new Date(data.data.created_at).toLocaleString(),
      is_http_server: data.data.is_http_server || false,
    };
  } catch (error) {
    console.error("Error creating stream:", error);
    throw error;
  }
}

export async function updateStream(
  id: string,
  stream: {
    name: string;
    status: string;
    input_component: string;
    input_label: string;
    input_config: string;
    output_component: string;
    output_label: string;
    output_config: string;
    processors: Array<{
      label: string;
      component: string;
      config: string;
    }>;
  }
): Promise<Stream> {
  try {
    const response = await fetch(`${API_BASE_URL}/streams/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: stream.name,
        status: stream.status,
        input_component: stream.input_component,
        input_label: stream.input_label,
        input_config: stream.input_config,
        output_component: stream.output_component,
        output_label: stream.output_label,
        output_config: stream.output_config,
        processors: stream.processors.map((processor) => ({
          label: processor.label,
          component: processor.component,
          config: processor.config,
        })),
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      id: data.data.id,
      parentID: data.data.parent_id || data.data.id,
      name: data.data.name,
      status: data.data.status,
      input_label: data.data.input_label,
      input_component: data.data.input_component,
      input_config: data.data.input_config,
      output_label: data.data.output_label,
      output_component: data.data.output_component,
      output_config: data.data.output_config,
      processors: data.data.processors?.map((processor: any) => ({
        label: processor.label,
        component: processor.component,
        config: processor.config,
      })) || [],
      createdAt: new Date(data.data.created_at).toLocaleString(),
      is_http_server: data.data.is_http_server || false,
    };
  } catch (error) {
    console.error("Error updating stream:", error);
    throw error;
  }
}

export async function deleteStream(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/streams/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error deleting stream:", error);
    throw error;
  }
}

export async function fetchComponentConfigs(): Promise<ComponentConfig[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/component-configs`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return data?.data.map((config: any) => ({
      id: config.id,
      name: config.name,
      section: config.section,
      component: config.component,
      createdAt: new Date(config.created_at).toLocaleString(),
      type: config.section === "pipeline" ? "processor" : config.section,
    }));
  } catch (error) {
    console.error("Error fetching component configs:", error);
    throw error;
  }
}

export async function fetchComponentConfig(
  id: string
): Promise<ComponentConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/component-configs/${id}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      id: data.data.id,
      name: data.data.name,
      section: data.data.section,
      component: data.data.component,
      createdAt: new Date(data.data.created_at).toLocaleString(),
      type: data.data.section,
      config: data.data.config,
    };
  } catch (error) {
    console.error("Error fetching component config:", error);
    throw error;
  }
}

export async function createComponentConfig(
  config: Omit<ComponentConfig, "id" | "createdAt" | "type">
): Promise<ComponentConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/component-configs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: config.name,
        section: config.section,
        component: config.component,
        config: config.config,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      id: data.data.id,
      name: data.data.name,
      section: data.data.section,
      component: data.data.component,
      createdAt: new Date(data.data.created_at).toLocaleString(),
      type: data.data.section,
      config: data.data.config,
    };
  } catch (error) {
    console.error("Error creating component config:", error);
    throw error;
  }
}

export async function updateComponentConfig(
  id: string,
  config: Omit<ComponentConfig, "id" | "createdAt" | "type">
): Promise<ComponentConfig> {
  try {
    const response = await fetch(`${API_BASE_URL}/component-configs/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: config.name,
        section: config.section,
        component: config.component,
        config: config.config,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      id: data.id,
      name: data.name,
      section: data.section,
      component: data.component,
      createdAt: new Date(data.created_at).toLocaleString(),
      type: data.section,
      config: data.config,
    };
  } catch (error) {
    console.error("Error updating component config:", error);
    throw error;
  }
}

export async function deleteComponentConfig(id: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/component-configs/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error("Error deleting component config:", error);
    throw error;
  }
}
