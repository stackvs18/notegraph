import axios from 'axios';

// Create an axios HTTP client configured with the Django Graph API base URL
const graphApiClient = axios.create({
  baseURL: import.meta.env.VITE_GRAPH_API_URL,
});

// Sends a GET request to the Django Graph API to fetch all nodes and edges
export async function getGraphData() {
  const response = await graphApiClient.get('/graph/');
  return response.data;
}

// Sends a GET request to the Django Graph API to fetch graph statistics
export async function getGraphStats() {
  const response = await graphApiClient.get('/graph/stats/');
  return response.data;
}
