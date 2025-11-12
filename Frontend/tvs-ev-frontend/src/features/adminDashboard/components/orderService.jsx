import axios from "axios";
/**
 * :white_check_mark: Base URL now goes through Gateway (not directly to microservice)
 * You can still override with .env if needed.
 */
const BASE =
  import.meta.env.VITE_GATEWAY_BASE ||
  "http://localhost:8083/api/orders";
/**
 * Create a reusable axios instance for authorized requests
 */
function createAuthorizedAxios(token) {
  if (!token) throw new Error("Missing auth token. Please login again.");
  return axios.create({
    baseURL: BASE,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}
/**
 * :white_check_mark: Assign plan to a user (after successful Razorpay payment)
 * @param {string} userId - UUID of the user
 * @param {string} planId - UUID of the plan
 * @param {string} razorpayPaymentId - Razorpay payment ID
 * @param {string} internalPaymentId - Internal payment ID from backend
 * @param {string} token - JWT token (Authorization)
 */
export async function assignPlan(
  userId,
  planId,
  razorpayPaymentId,
  internalPaymentId,
  token
) {
  const api = createAuthorizedAxios(token);
  const params = new URLSearchParams({
    razorpayPaymentId,
    internalPaymentId,
  });
  const res = await api.post(`/${userId}/assign/${planId}?${params.toString()}`);
  return res.data;
}
/**
 * :white_check_mark: Cancel a plan for a user
 */
export async function cancelPlan(userId, planId, token) {
  const api = createAuthorizedAxios(token);
  const res = await api.post(`/${userId}/cancel/${planId}`);
  return res.data;
}
/**
 * :white_check_mark: Fetch all active plans (orders) for a user
 */
export async function fetchUserPlans(userId, token) {
  const api = createAuthorizedAxios(token);
  const res = await api.get(`/${userId}/plans`);
  return res.data;
}
/**
 * :white_check_mark: Fetch all orders (admin only)
 */
export async function fetchAllOrders(token) {
  const api = createAuthorizedAxios(token);
  const res = await api.get(`/all`);
  return res.data;
}