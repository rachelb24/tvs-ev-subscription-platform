import api from "/src/services/api.js";
export async function initiatePayment(planId, tokenParam, payload = null) {
  try {
    const token = tokenParam ?? localStorage.getItem("token");
    if (!token) throw new Error("Missing auth token. Please login.");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    const body = payload && typeof payload === "object" ? { planId, ...payload } : { planId };
    const response = await api.post("/api/payments/create", body, { headers });
    return response.data;
  } catch (error) {
    console.error("Error initiating payment:", error);
    const errMsg =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Unknown error";
    throw new Error(`Payment creation failed: ${JSON.stringify(errMsg)}`);
  }
}
/* rest of the file unchanged: assignFreePlan and verifyPaymentAndAssign */
export async function assignFreePlan(userId, planId) {
  try {
    const orderAssignUrl = `/api/orders/${encodeURIComponent(userId)}/assign-free/${encodeURIComponent(planId)}`;
    const orderResponse = await api.post(orderAssignUrl, null, {
      headers: { "Content-Type": "application/json" },
    });
    const subscriptionAssignUrl = `/api/subscriptions/${encodeURIComponent(userId)}/assign-free/${encodeURIComponent(planId)}`;
    const subscriptionResponse = await api.post(subscriptionAssignUrl, null, {
      headers: { "Content-Type": "application/json" },
    });
    return {
      order: orderResponse.data,
      subscription: subscriptionResponse.data,
    };
  } catch (error) {
    const errMsg =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Unknown error";
    console.error("Free plan assignment failed:", errMsg);
    throw new Error(`Free plan assignment failed: ${errMsg}`);
  }
}
export async function verifyPaymentAndAssign(
  razorpayResponse,
  userId,
  planId,
  internalPaymentIdParam
) {
  try {
    const verifyResp = await api.post("/api/payments/verify", {
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature,
    });
    const verifyData = verifyResp.data;
    if (
      !verifyData ||
      (verifyData.status && verifyData.status.toUpperCase() !== "SUCCESS") ||
      verifyData.eligibleForPlanAssignment === false
    ) {
      throw new Error(
        `Payment not eligible for assignment. verifyData: ${JSON.stringify(
          verifyData
        )}`
      );
    }
    const internalPaymentId =
      verifyData.internalPaymentId ?? internalPaymentIdParam;
    const razorpayPaymentIdFromVerify =
      verifyData.razorpayPaymentId ?? razorpayResponse.razorpay_payment_id;
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Missing auth token for order assignment");
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    const assignOrderUrl = `/api/orders/${encodeURIComponent(
      userId
    )}/assign/${encodeURIComponent(planId)}?razorpayPaymentId=${encodeURIComponent(
      razorpayPaymentIdFromVerify
    )}${
      internalPaymentId
        ? `&internalPaymentId=${encodeURIComponent(internalPaymentId)}`
        : ""
    }`;
    const assignSubscriptionUrl = `/api/subscriptions/${encodeURIComponent(
      userId
    )}/assign/${encodeURIComponent(planId)}`;
    const tryPost = async (url) => {
      try {
        const resp = await api.post(url, null, { headers });
        return resp.data;
      } catch (err) {
        err._status = err?.response?.status;
        err._msg =
          err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Unknown error";
        throw err;
      }
    };
    let orderAssignResp;
    try {
      orderAssignResp = await tryPost(assignOrderUrl);
    } catch (err1) {
      console.error("Order assignment failed:", err1);
      throw new Error(`Order assignment failed: ${err1._msg}`);
    }
    let subscriptionAssignResp;
    try {
      subscriptionAssignResp = await tryPost(assignSubscriptionUrl);
    } catch (err2) {
      console.error("Subscription assignment failed:", err2);
      throw new Error(
        `Subscription assignment failed: ${err2._msg}. Order assignment succeeded, but subscription failed.`
      );
    }
    return {
      status: "SUCCESS",
      message: "Order and Subscription assigned successfully.",
      order: orderAssignResp,
      subscription: subscriptionAssignResp,
    };
  } catch (error) {
    console.error("Error in verifyPaymentAndAssign:", error);
    if (error.message && error.message.includes("Network Error")) {
      throw new Error(
        "Payment verification/assignment failed: Network Error (possible CORS or redirect-to-login)."
      );
    }
    const errMsg =
      error.response?.data?.message ||
      error.response?.data ||
      error.message ||
      "Unknown error";
    throw new Error(
      `Payment verification/assignment failed: ${JSON.stringify(errMsg)}`
    );
  }
}
