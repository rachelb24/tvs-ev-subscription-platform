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
import axios from "axios";
import { useAuth } from "../auth/authContext";

const PaymentConfirm = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  // ✅ Load plan details
  useEffect(() => {
    if (!planId) {
      setError("Missing plan id");
      setLoading(false);
      return;
    }

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
    if (!token) {
      navigate("/login", { state: { from: `/payment/confirm/${planId}` } });
      return;
    }

    try {
      setProcessing(true);

      // ✅ Step 1: Create Razorpay order
      const createResp = await axios.post(
        "http://localhost:9008/api/payments/create",
        { planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { razorpayOrderId, amount, currency } = createResp.data;
      console.log("✅ Created Razorpay order:", createResp.data);

      // ✅ Step 2: Load Razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: "rzp_test_RXBvSsz3XWbeok", // your test key
          amount,
          currency,
          name: "TVS Subscription",
          description: `Payment for ${plan.name}`,
          order_id: razorpayOrderId,
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
          },
          theme: { color: "#0033a0" },
          handler: async function (response) {
            console.log("🟢 Razorpay success:", response);

            try {
              // ✅ Step 3: Verify payment
              const verifyResp = await axios.post(
                "http://localhost:9008/api/payments/verify",
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  plan_id: planId,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );

              console.log("✅ Verification response:", verifyResp.data);
              const result = verifyResp.data;

              if (result.status === "SUCCESS") {
                navigate(`/payment/success/${planId}`, {
                  state: {
                    planName: plan.name,
                    paymentId: response.razorpay_payment_id,
                  },
                });
              } else {
                alert("Payment verification failed.");
              }
            } catch (err) {
              console.error("Verification error:", err.response?.data || err.message);
              alert("Payment verification failed. Please contact support.");
            }
          },
          modal: {
            ondismiss: () => setProcessing(false),
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };
    } catch (err) {
      console.error("Payment initiation error:", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to start payment. Please try again.");
    } finally {
      setProcessing(false);
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
          {error || "Invalid Plan ID or plan not found"}
        </Typography>
        <Button
          sx={{ mt: 2 }}
          variant="contained"
          onClick={() => navigate("/explore")}
        >
          Back to Plans
        </Button>
      </Box>
    );

  const getDurationLabel = (p) => {
    if (!p?.duration) return "";
    switch (p.duration.toUpperCase()) {
      case "YEAR":
        return "Yearly";
      case "QUARTER":
        return "3 Months";
      case "MONTH":
        return "Monthly";
      default:
        return p.duration;
    }
  };

  const renderPrice = (p) => {
    if (p.totalPrice === 0)
      return <Typography variant="h6" color="success.main">FREE</Typography>;
    if (p.isDiscountActive && p.discountedPrice < p.totalPrice) {
      return (
        <Typography variant="h6">
          <s style={{ color: "#888", marginRight: 6 }}>₹{p.totalPrice}</s> ₹{p.discountedPrice}
        </Typography>
      );
    }
    return <Typography variant="h6">₹{p.totalPrice}</Typography>;
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
          background: "rgba(255, 255, 255, 0.95)",
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

        <Box mt={2} mb={2}>
          {renderPrice(plan)}
        </Box>

        <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#0033a0",
              "&:hover": { backgroundColor: "#00206b" },
            }}
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
