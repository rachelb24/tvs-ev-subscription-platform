// src/planService.js
import axios from "axios";
const BASE = import.meta.env.VITE_PLAN_BASE || "http://localhost:8081/api/v1/plans";
/**
 * Fetch plan by id.
 * Accepts planId (UUID string) and optional token for auth.
 */
export async function fetchPlanById(planId, token) {
  if (!planId) throw new Error("fetchPlanById: missing planId");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await axios.get(`${BASE}/${planId}`, { headers });
  return res.data;
}
/* (other planService helpers retained from before, exported if needed) */
export async function fetchPlans() {
  const res = await axios.get(BASE);
  return res.data;
}
export async function createPlan(payload) {
  const res = await axios.post(BASE, payload);
  return res.data;
}
export async function updatePlan(planId, payload) {
  const body = {
    name: payload.name || "",
    description: payload.description || "",
    duration: payload.duration || "",
    featureIds: payload.featureIds || [],
    isActive: payload.isActive !== undefined ? payload.isActive : true,
    discountPercentage: payload.discountPercentage || 0,
    isDiscountActive: payload.isDiscountActive !== undefined ? payload.isDiscountActive : false,
  };
  const res = await axios.put(`${BASE}/${planId}`, body);
  return res.data;
}
export async function deletePlan(planId) {
  const res = await axios.delete(`${BASE}/${planId}`);
  return res.data;
}
export async function activatePlan(planId) {
  const res = await axios.post(`${BASE}/${planId}/activate`);
  return res.data;
}
export async function deactivatePlan(planId) {
  const res = await axios.post(`${BASE}/${planId}/deactivate`);
  return res.data;
}
export async function previewPrice(featureIds = []) {
  const params = new URLSearchParams();
  featureIds.forEach(id => params.append("featureIds", id));
  const res = await axios.get(`${BASE}/preview?${params.toString()}`);
  return res.data;
}
export async function fetchActivePlans() {
  const res = await axios.get(`${BASE}/active`);
  return res.data;
}