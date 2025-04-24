import { Stream } from "./entities";

// Placeholder API functions - adapt based on original logic and backend
const API_BASE_URL = "http://localhost:8080/v0"; // Adjust if needed

export async function fetchStreams(): Promise<Stream[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/streams?status=all`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Add data transformation logic here if needed to match the Stream type
    // Example assuming API returns data structure similar to what was in component:
    return data.data.map((stream: any) => ({
      id: stream.id,
      name: stream.name,
      status: stream.status,
      inputID: stream.input_id,
      inputLabel: stream.input_label,
      processors: stream.processors?.map((processor: any) => ({
        processorID: processor.processor_id,
        label: processor.label,
        createdAt: new Date(processor.created_at).toLocaleString(),
      })) || [],
      outputID: stream.output_id,
      outputLabel: stream.output_label,
      createdAt: new Date(stream.created_at).toLocaleString(),
      // Add other fields as necessary
    }));

  } catch (error) {
    console.error("Error fetching streams:", error);
    throw error; // Re-throw error to be handled by the calling component
  }
}

// Add other API functions (fetchComponentConfigs, etc.) here if they were originally in an api file 