// src/features/payments/PaymentConfirm.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Chip,
} from "@mui/material";
import { getPlanById } from "../explorePlans/explorePlansService";
import { initiatePayment, verifyPaymentAndAssign } from "./paymentService";
import { useAuth } from "../auth/authContext";
import { fetchProfile } from "../users/userService";
const loadRazorpayScript = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve(window.Razorpay);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
const PaymentConfirm = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { token, user, refreshProfile } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPlanById(planId);
        setPlan(data);
      } catch (err) {
        console.error("Failed to load plan:", err);
        setError("Failed to load plan details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [planId]);
  const handleProceedToPay = async () => {
    const currentToken = token ?? localStorage.getItem("token");
    if (!currentToken) {
      navigate("/login", { state: { from: `/payment/confirm/${planId}` } });
      return;
    }
    let currentUser = user;
    if (!currentUser || !currentUser.userId) {
      try {
        const refreshed = await refreshProfile?.();
        if (refreshed) currentUser = refreshed;
        else currentUser = await fetchProfile();
      } catch {
        alert("Unable to load user profile. Please try again.");
        return;
      }
    }
    try {
      setProcessing(true);
      const discountedAmount =
  plan.isDiscountActive && plan.discountedPrice < plan.totalPrice
    ? plan.discountedPrice
    : plan.totalPrice;
      // Step 1: Create order
      const orderData = await initiatePayment(planId, currentToken);
      const { razorpayOrderId, amount, currency, internalPaymentId } = orderData;
      // Step 2: Load Razorpay SDK
      await loadRazorpayScript();
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_RXBvSsz3XWbeok",
        amount: discountedAmount * 100,
        currency: currency || "INR",
        name: "TVS Subscription",
        description: `Payment for plan: ${plan?.name || planId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: currentUser?.fullName || currentUser?.name || "",
          email: currentUser?.email || "",
        },
        handler: async (response) => {
          setProcessing(true);
          try {
            // Step 3: Verify & assign
            const result = await verifyPaymentAndAssign(
              response,
              currentUser.userId,
              planId,
              internalPaymentId
            );
            if (result?.status === "SUCCESS") {
              try {
                await refreshProfile?.();
              } catch (e) {
                console.warn("Profile refresh failed:", e);
              }
              // :white_check_mark: Pass correct paymentId & date
              navigate(`/payment/success/${planId}`, {
                state: {
                  planName: result.planName,
                  paymentId:
                    result.razorpayPaymentId ||
                    response.razorpay_payment_id ||
                    "N/A",
                  paymentDate:
                    result.paymentDate || new Date().toISOString(),
                },
              });
            } else {
              alert("Payment verified but plan assignment failed.");
            }
          } catch (err) {
            console.error("Payment verify/assign error:", err);
            alert("Payment verification failed: " + (err.message || err));
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
          },
        },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("Payment initiation error:", err);
      alert(err.message || "Failed to start payment. Please try again.");
    }
  };
  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  if (error || !plan)
    return (
      <Box textAlign="center" py={8}>
        <Typography color="error" variant="h6">
          {error || "Invalid plan ID"}
        </Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/explore")}>
          Back to Plans
        </Button>
      </Box>
    );
  const getDurationLabel = (p) => {
    switch (p?.duration?.toUpperCase()) {
      case "YEAR":
        return "Yearly";
      case "QUARTER":
        return "3 Months";
      case "MONTH":
        return "Monthly";
      default:
        return p?.duration || "";
    }
  };
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" px={2}>
      <Paper
        elevation={6}
        sx={{
          p: 6,
          borderRadius: 4,
          width: "100%",
          maxWidth: 680,
          textAlign: "center",
          background: "rgba(255,255,255,0.95)",
        }}
      >
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Confirm Your Payment
        </Typography>
        <Typography variant="h6" mt={3}>
          {plan.name}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {getDurationLabel(plan)} • {plan.description}
        </Typography>
        <Stack direction="row" spacing={1} justifyContent="center" mb={2} flexWrap="wrap">
          {plan.features?.map((f) => (
            <Chip key={f.featureId} label={`${f.name}: ${f.defaultIncludedUnits} units`} size="small" />
          ))}
        </Stack>
        <Typography variant="h6">
          ₹
          {plan.isDiscountActive && plan.discountedPrice < plan.totalPrice
            ? plan.discountedPrice
            : plan.totalPrice}
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#0033A0", "&:hover": { backgroundColor: "#00206B" } }}
            onClick={handleProceedToPay}
            disabled={processing}
          >
            {processing ? "Processing..." : "Proceed to Pay"}
          </Button>
          <Button variant="outlined" onClick={() => navigate("/explore")}>
            Cancel
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};
export default PaymentConfirm;