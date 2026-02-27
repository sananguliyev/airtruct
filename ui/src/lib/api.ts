import {
  Stream,
  StreamEvent,
  Worker,
  Secret,
  Cache,
  RateLimit,
  FileEntry,
} from "./entities";
import * as yaml from "js-yaml";

// Placeholder API functions - adapt based on original logic and backend
const API_BASE_URL = "/api/v0";

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem("airtruct_token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(response: Response): Promise<Response> {
  if (response.status === 401) {
    localStorage.removeItem("airtruct_token");
    window.location.href = "/login?error=session_expired";
    throw new Error("Unauthorized - redirecting to login");
  }
  return response;
}

export async function fetchWorkers(): Promise<Worker[]> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/workers/all`, {
        headers: getAuthHeaders(),
      }),
    );
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
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/streams?status=all`, {
        headers: getAuthHeaders(),
      }),
    );
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
      buffer_id: stream.buffer_id || undefined,
      processors:
        stream.processors?.map((processor: any) => ({
          label: processor.label,
          component: processor.component,
          config: processor.config || "",
        })) || [],
      createdAt: new Date(stream.created_at).toLocaleString(),
      is_http_server: stream.is_http_server || false,
      is_mcp_tool: stream.is_mcp_tool || false,
    }));
  } catch (error) {
    console.error("Error fetching streams:", error);
    throw error; // Re-throw error to be handled by the calling component
  }
}

export async function fetchStream(id: string): Promise<Stream> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/streams/${id}`, {
        headers: getAuthHeaders(),
      }),
    );
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
      buffer_id: data.data.buffer_id || undefined,
      processors:
        data.data.processors?.map((processor: any) => ({
          label: processor.label,
          component: processor.component,
          config: processor.config || "",
        })) || [],
      createdAt: new Date(data.data.created_at).toLocaleString(),
      is_http_server: data.data.is_http_server || false,
      is_mcp_tool: data.data.is_mcp_tool || false,
    };
  } catch (error) {
    console.error("Error fetching stream:", error);
    throw error;
  }
}

export async function createStream(stream: {
  name: string;
  status: string;
  input_component: string;
  input_label: string;
  input_config: string;
  output_component: string;
  output_label: string;
  output_config: string;
  buffer_id?: number;
  processors: Array<{
    label: string;
    component: string;
    config: string;
  }>;
}): Promise<Stream> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/streams`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: stream.name,
          status: stream.status,
          input_component: stream.input_component,
          input_label: stream.input_label,
          input_config: stream.input_config,
          output_component: stream.output_component,
          output_label: stream.output_label,
          output_config: stream.output_config,
          buffer_id: stream.buffer_id || undefined,
          processors: stream.processors.map((processor) => ({
            label: processor.label,
            component: processor.component,
            config: processor.config,
          })),
        }),
      }),
    );
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
      buffer_id: data.data.buffer_id || undefined,
      processors:
        data.data.processors?.map((processor: any) => ({
          label: processor.label,
          component: processor.component,
          config: processor.config || "",
        })) || [],
      createdAt: new Date(data.data.created_at).toLocaleString(),
      is_http_server: data.data.is_http_server || false,
      is_mcp_tool: data.data.is_mcp_tool || false,
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
    buffer_id?: number;
    processors: Array<{
      label: string;
      component: string;
      config: string;
    }>;
  },
): Promise<Stream> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/streams/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: stream.name,
          status: stream.status,
          input_component: stream.input_component,
          input_label: stream.input_label,
          input_config: stream.input_config,
          output_component: stream.output_component,
          output_label: stream.output_label,
          output_config: stream.output_config,
          buffer_id: stream.buffer_id || undefined,
          processors: stream.processors.map((processor) => ({
            label: processor.label,
            component: processor.component,
            config: processor.config,
          })),
        }),
      }),
    );
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
      buffer_id: data.data.buffer_id || undefined,
      processors:
        data.data.processors?.map((processor: any) => ({
          label: processor.label,
          component: processor.component,
          config: processor.config,
        })) || [],
      createdAt: new Date(data.data.created_at).toLocaleString(),
      is_http_server: data.data.is_http_server || false,
      is_mcp_tool: data.data.is_mcp_tool || false,
    };
  } catch (error) {
    console.error("Error updating stream:", error);
    throw error;
  }
}

export async function deleteStream(id: string): Promise<void> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/streams/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }),
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting stream:", error);
    throw error;
  }
}

export async function updateStreamStatus(
  id: string,
  status: string,
): Promise<Stream> {
  try {
    const stream = await fetchStream(id);

    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/streams/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: stream.name,
          status: status,
          input_component: stream.input_component,
          input_label: stream.input_label,
          input_config: stream.input_config,
          output_component: stream.output_component,
          output_label: stream.output_label,
          output_config: stream.output_config,
          processors: stream.processors.map((p) => ({
            label: p.label,
            component: p.component,
            config: p.config,
          })),
        }),
      }),
    );

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
        data.data.processors?.map((p: any) => ({
          label: p.label,
          component: p.component,
          config: p.config,
        })) || [],
      createdAt: new Date(data.data.created_at).toLocaleString(),
      is_http_server: data.data.input_component === "http_server",
      is_mcp_tool: data.data.input_component === "mcp_tool",
    };
  } catch (error) {
    console.error("Error updating stream status:", error);
    throw error;
  }
}

export async function fetchSecrets(): Promise<Secret[]> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/secrets`, {
        headers: getAuthHeaders(),
      }),
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    if (data.data && Array.isArray(data.data)) {
      return data.data.map((secret: any, index: number) => {
        if (!secret || typeof secret.key === "undefined") {
          throw new Error(`Invalid secret data at index ${index}`);
        }

        return {
          key: secret.key,
          createdAt: secret.created_at
            ? new Date(secret.created_at).toLocaleString()
            : "Unknown",
        };
      });
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching secrets:", error);
    throw error;
  }
}

export async function createSecret(secretData: {
  key: string;
  value: string;
}): Promise<Secret> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/secrets`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          key: secretData.key,
          value: secretData.value,
        }),
      }),
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return {
      key: secretData.key,
      createdAt: new Date().toLocaleString(),
    };
  } catch (error) {
    console.error("Error creating secret:", error);
    throw error;
  }
}

export async function deleteSecret(key: string): Promise<void> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/secrets/${key}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }),
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting secret:", error);
    throw error;
  }
}

export async function fetchCaches(): Promise<Cache[]> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/caches`, {
        headers: getAuthHeaders(),
      }),
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return data?.data.map((cache: any) => ({
      id: cache.id,
      label: cache.label,
      component: cache.component,
      config: cache.config || "",
      createdAt: new Date(cache.created_at).toLocaleString(),
    }));
  } catch (error) {
    console.error("Error fetching caches:", error);
    throw error;
  }
}

export async function fetchCache(id: string): Promise<Cache> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/caches/${id}`, {
        headers: getAuthHeaders(),
      }),
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      id: data.data.id,
      label: data.data.label,
      component: data.data.component,
      config: data.data.config || "",
      createdAt: new Date(data.data.created_at).toLocaleString(),
    };
  } catch (error) {
    console.error("Error fetching cache:", error);
    throw error;
  }
}

export async function createCache(cacheData: {
  label: string;
  component: string;
  config: any;
}): Promise<Cache> {
  try {
    const configYaml = yaml.dump(cacheData.config);

    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/caches`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          label: cacheData.label,
          component: cacheData.component,
          config: configYaml,
        }),
      }),
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.data.id,
      label: data.data.label,
      component: data.data.component,
      config: data.data.config || "",
      createdAt: new Date(data.data.created_at).toLocaleString(),
    };
  } catch (error) {
    console.error("Error creating cache:", error);
    throw error;
  }
}

export async function updateCache(
  id: string,
  cacheData: {
    label: string;
    component: string;
    config: any;
  },
): Promise<Cache> {
  try {
    const configYaml = yaml.dump(cacheData.config);

    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/caches/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: parseInt(id),
          label: cacheData.label,
          component: cacheData.component,
          config: configYaml,
        }),
      }),
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.data.id,
      label: data.data.label,
      component: data.data.component,
      config: data.data.config || "",
      createdAt: new Date(data.data.created_at).toLocaleString(),
    };
  } catch (error) {
    console.error("Error updating cache:", error);
    throw error;
  }
}

export async function deleteCache(id: string): Promise<void> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/caches/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }),
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting cache:", error);
    throw error;
  }
}

export async function fetchRateLimits(): Promise<RateLimit[]> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/rate-limits`, {
        headers: getAuthHeaders(),
      }),
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return data?.data.map((rateLimit: any) => ({
      id: rateLimit.id,
      label: rateLimit.label,
      component: rateLimit.component,
      config: rateLimit.config || "",
      createdAt: new Date(rateLimit.created_at).toLocaleString(),
    }));
  } catch (error) {
    console.error("Error fetching rate limits:", error);
    throw error;
  }
}

export async function fetchRateLimit(id: string): Promise<RateLimit> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/rate-limits/${id}`, {
        headers: getAuthHeaders(),
      }),
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return {
      id: data.data.id,
      label: data.data.label,
      component: data.data.component,
      config: data.data.config || "",
      createdAt: new Date(data.data.created_at).toLocaleString(),
    };
  } catch (error) {
    console.error("Error fetching rate limit:", error);
    throw error;
  }
}

export async function createRateLimit(rateLimitData: {
  label: string;
  component: string;
  config: any;
}): Promise<RateLimit> {
  try {
    const configYaml = yaml.dump(rateLimitData.config);

    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/rate-limits`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          label: rateLimitData.label,
          component: rateLimitData.component,
          config: configYaml,
        }),
      }),
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.data.id,
      label: data.data.label,
      component: data.data.component,
      config: data.data.config || "",
      createdAt: new Date(data.data.created_at).toLocaleString(),
    };
  } catch (error) {
    console.error("Error creating rate limit:", error);
    throw error;
  }
}

export async function updateRateLimit(
  id: string,
  rateLimitData: {
    label: string;
    component: string;
    config: any;
  },
): Promise<RateLimit> {
  try {
    const configYaml = yaml.dump(rateLimitData.config);

    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/rate-limits/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: parseInt(id),
          label: rateLimitData.label,
          component: rateLimitData.component,
          config: configYaml,
        }),
      }),
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.data.id,
      label: data.data.label,
      component: data.data.component,
      config: data.data.config || "",
      createdAt: new Date(data.data.created_at).toLocaleString(),
    };
  } catch (error) {
    console.error("Error updating rate limit:", error);
    throw error;
  }
}

export async function deleteRateLimit(id: string): Promise<void> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/rate-limits/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }),
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting rate limit:", error);
    throw error;
  }
}

export async function fetchBuffers(): Promise<any[]> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/buffers`, {
        headers: getAuthHeaders(),
      }),
    );

    const data = await response.json();

    return data.data.map((buffer: any) => ({
      id: buffer.id,
      label: buffer.label,
      component: buffer.component,
      config: buffer.config,
      createdAt: buffer.created_at,
    }));
  } catch (error) {
    console.error("Error fetching buffers:", error);
    throw error;
  }
}

export async function fetchBuffer(id: string): Promise<any> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/buffers/${id}`, {
        headers: getAuthHeaders(),
      }),
    );

    const data = await response.json();

    return {
      id: data.data.id,
      label: data.data.label,
      component: data.data.component,
      config: data.data.config,
      createdAt: data.data.created_at,
    };
  } catch (error) {
    console.error("Error fetching buffer:", error);
    throw error;
  }
}

export async function createBuffer(data: {
  label: string;
  component: string;
  config: any;
}): Promise<any> {
  try {
    const configYaml = yaml.dump(data.config);

    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/buffers`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          label: data.label,
          component: data.component,
          config: configYaml,
        }),
      }),
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const responseData = await response.json();

    return {
      id: responseData.data.id,
      label: responseData.data.label,
      component: responseData.data.component,
      config: responseData.data.config,
      createdAt: responseData.data.created_at,
    };
  } catch (error) {
    console.error("Error creating buffer:", error);
    throw error;
  }
}

export async function updateBuffer(
  id: string,
  data: {
    label: string;
    component: string;
    config: any;
  },
): Promise<any> {
  try {
    const configYaml = yaml.dump(data.config);

    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/buffers/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: Number(id),
          label: data.label,
          component: data.component,
          config: configYaml,
        }),
      }),
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }

    const responseData = await response.json();

    return {
      id: responseData.data.id,
      label: responseData.data.label,
      component: responseData.data.component,
      config: responseData.data.config,
      createdAt: responseData.data.created_at,
    };
  } catch (error) {
    console.error("Error updating buffer:", error);
    throw error;
  }
}

export async function deleteBuffer(id: string): Promise<void> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/buffers/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }),
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || `HTTP error! status: ${response.status}`,
      );
    }
  } catch (error) {
    console.error("Error deleting buffer:", error);
    throw error;
  }
}

export async function fetchStreamEvents(
  streamId: string,
  params: {
    limit: number;
    offset: number;
    startTime: string;
    endTime: string;
  },
): Promise<{ data: StreamEvent[]; total: number }> {
  try {
    const query = new URLSearchParams({
      limit: params.limit.toString(),
      offset: params.offset.toString(),
      start_time: params.startTime,
      end_time: params.endTime,
    });

    const response = await handleResponse(
      await fetch(
        `${API_BASE_URL}/streams/${streamId}/events?${query.toString()}`,
        {
          headers: getAuthHeaders(),
        },
      ),
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    return {
      data: (result.data || []).map((event: any) => ({
        id: event.id,
        worker_stream_id: event.workerStreamId,
        flow_id: event.flowId,
        section: event.section,
        component_label: event.componentLabel,
        type: event.type,
        content: event.content,
        meta: event.meta || {},
        created_at: event.createdAt,
      })),
      total: result.total || 0,
    };
  } catch (error) {
    console.error("Error fetching stream events:", error);
    throw error;
  }
}

// File methods

export async function fetchFiles(): Promise<FileEntry[]> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/files`, {
        headers: getAuthHeaders(),
      }),
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    return (data?.data || []).map((file: any) => ({
      id: file.id,
      parentID: file.parent_id,
      key: file.key,
      size: file.size || 0,
      createdAt: new Date(file.created_at).toLocaleString(),
      updatedAt: file.updated_at
        ? new Date(file.updated_at).toLocaleString()
        : undefined,
    }));
  } catch (error) {
    console.error("Error fetching files:", error);
    throw error;
  }
}

export async function fetchFile(id: string): Promise<FileEntry> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/files/${id}`, {
        headers: getAuthHeaders(),
      }),
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    let content = "";
    if (data.data.content) {
      content = atob(data.data.content);
    }

    return {
      id: data.data.id,
      parentID: data.data.parent_id,
      key: data.data.key,
      content,
      size: data.data.size || 0,
      createdAt: new Date(data.data.created_at).toLocaleString(),
      updatedAt: data.data.updated_at
        ? new Date(data.data.updated_at).toLocaleString()
        : undefined,
    };
  } catch (error) {
    console.error("Error fetching file:", error);
    throw error;
  }
}

export async function createFile(fileData: {
  key: string;
  content: string;
}): Promise<FileEntry> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/files`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          key: fileData.key,
          content: btoa(fileData.content),
        }),
      }),
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.data.id,
      key: data.data.key,
      size: data.data.size || 0,
      createdAt: new Date(data.data.created_at).toLocaleString(),
    };
  } catch (error) {
    console.error("Error creating file:", error);
    throw error;
  }
}

export async function updateFile(
  id: string,
  fileData: {
    key: string;
    content: string;
  },
): Promise<FileEntry> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/files/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          id: parseInt(id),
          key: fileData.key,
          content: btoa(fileData.content),
        }),
      }),
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.data.id,
      key: data.data.key,
      size: data.data.size || 0,
      createdAt: new Date(data.data.created_at).toLocaleString(),
    };
  } catch (error) {
    console.error("Error updating file:", error);
    throw error;
  }
}

export async function deleteFile(id: string): Promise<void> {
  try {
    const response = await handleResponse(
      await fetch(`${API_BASE_URL}/files/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      }),
    );

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}
