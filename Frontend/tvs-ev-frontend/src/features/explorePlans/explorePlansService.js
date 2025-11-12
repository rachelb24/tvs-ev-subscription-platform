// src/services/explorePlansService.jsx
import axios from "axios";
import { initiatePayment as initiatePaymentCanonical } from "../payments/paymentService";

const API_BASE_URL = "http://localhost:8081/api/v1/plans"; // correct base

/**
 * Fetch all available plans from backend
 */
export const fetchPlans = async () => {
  try {
    const response = await axios.get(API_BASE_URL);
    return response.data || [];
  } catch (error) {
    console.error("Error fetching plans:", error);
    throw error;
  }
};

/**
 * Fetch single plan by id (planId is UUID string)
 */
export const getPlanById = async (planId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/${planId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching plan ${planId}:`, error);
    throw error;
  }
};

/**
 * (Placeholder) Initiate payment for a selected plan.
 */



export const initiatePayment = async (planId, token) => {
  return initiatePaymentCanonical(planId, token);
};