import axios from "axios";

// Base URL for all feature-related endpoints
const BASE = import.meta.env.VITE_FEATURE_BASE || "http://localhost:9001/api/v1/features";

// Fetch all features
export async function fetchFeatures() {
  const res = await axios.get(`${BASE}`);
  return res.data;
}

// Fetch all active features
export async function fetchActiveFeatures() {
  const res = await axios.get(`${BASE}/active`);
  return res.data;
}

// Fetch feature by ID
export async function fetchFeatureById(id) {
  const res = await axios.get(`${BASE}/${id}`);
  return res.data;
}

// Search features
export async function searchFeatures(queryParams) {
  const res = await axios.get(`${BASE}/search`, { params: queryParams });
  return res.data;
}

// Create a new feature
export async function createFeature(payload) {
  const res = await axios.post(`${BASE}`, payload);
  return res.data;
}

// Update an existing feature
export async function updateFeature(id, payload) {
  const res = await axios.put(`${BASE}/${id}`, payload);
  return res.data;
}

// Delete a feature
export async function deleteFeature(id) {
  const res = await axios.delete(`${BASE}/${id}`);
  return res.data;
}
