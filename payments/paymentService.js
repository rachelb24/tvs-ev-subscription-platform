import api from "../../services/api";

export async function initiatePayment(planId) {
  const response = await api.post("/api/payments/create", { planId });
  // Backend response should include:
  // { razorpayOrderId, amount, currency, internalPaymentId }
  return response.data;
}

export async function verifyPaymentAndAssign(
  razorpayResponse,
  userId,
  planId,
  internalPaymentId
) {
  // Step 1: Verify payment
  const verifyResponse = await api.post("/api/payments/verify", {
    razorpay_order_id: razorpayResponse.razorpay_order_id,
    razorpay_payment_id: razorpayResponse.razorpay_payment_id,
    razorpay_signature: razorpayResponse.razorpay_signature,
  });

  const verifyData = verifyResponse.data;
  if (!verifyData || verifyData.status !== "SUCCESS") {
    throw new Error("Payment verification failed or invalid response");
  }

  // Step 2: Assign plan to user (trigger email + DB update)
  const assignUrl = `/api/orders/${userId}/assign/${planId}?razorpayPaymentId=${encodeURIComponent(
    verifyData.razorpayPaymentId
  )}`;

  const assignResp = await api.post(assignUrl);
  return {
    status: "SUCCESS",
    planName: assignResp.data.planName || "Subscription Plan",
  };
}
