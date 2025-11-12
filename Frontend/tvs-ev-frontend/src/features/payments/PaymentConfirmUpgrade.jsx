// src/features/payments/PaymentConfirm.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  const location = useLocation();
  const incomingState = location.state || {}; // may contain adjustedPrice, isUpgrade, creditAmount
  const { token, user, refreshProfile } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [effectiveAmount, setEffectiveAmount] = useState(null); // number in rupees
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPlanById(planId);
        setPlan(data);
        // Determine effective amount:
        // 1) prefer incomingState.adjustedPrice
        // 2) fallback to sessionStorage pendingPurchase_{planId}
        // 3) fallback to plan's discounted/total price
        let adj = incomingState?.adjustedPrice;
        if (adj === undefined || adj === null) {
          try {
            const pending = sessionStorage.getItem(`pendingPurchase_${planId}`);
            if (pending) {
              const parsed = JSON.parse(pending);
              adj = parsed?.adjustedPrice;
            }
          } catch (e) {
            console.warn("Failed reading pendingPurchase from sessionStorage", e);
          }
        }
        let chosen;
        if (adj !== undefined && adj !== null && !Number.isNaN(Number(adj))) {
          chosen = Number(adj);
        } else {
          chosen =
            data.isDiscountActive && data.discountedPrice < data.totalPrice
              ? Number(data.discountedPrice)
              : Number(data.totalPrice);
        }
        setEffectiveAmount(Number(chosen.toFixed(2)));
      } catch (err) {
        console.error("Failed to load plan:", err);
        setError("Failed to load plan details. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId]);
  const handleProceedToPay = async () => {
    const currentToken = token ?? localStorage.getItem("token");
    if (!currentToken) {
      navigate("/login", { state: { from: `/payment/confirm/upgrade/${planId}` } });
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
      // rupee amount shown to user
      const amountToPay =
        effectiveAmount ??
        (plan.isDiscountActive && plan.discountedPrice < plan.totalPrice
          ? plan.discountedPrice
          : plan.totalPrice);
      // convert to paise (integer)
      const amountInPaise = Math.round(Number(amountToPay) * 100);
      // send explicit amountInPaise to server to tell it exact order amount
      const orderData = await initiatePayment(planId, currentToken, {
        amountInPaise,
        amount: Number(amountToPay),
        isUpgrade: incomingState?.isUpgrade ?? false,
        creditAmount: incomingState?.creditAmount ?? 0,
      });
      // server must return razorpayOrderId and the authority amount (in paise)
      const razorpayOrderId = orderData?.razorpayOrderId;
      const serverAmountPaise = Number(orderData?.amount); // expected in paise
      const currency = orderData?.currency ?? "INR";
      const internalPaymentId = orderData?.internalPaymentId;
      if (!razorpayOrderId) {
        console.error("No razorpayOrderId from server:", orderData);
        alert("Server failed to create payment order. Please try again.");
        setProcessing(false);
        return;
      }
      if (!Number.isFinite(serverAmountPaise)) {
        console.warn("Server did not return numeric order amount; aborting:", orderData);
        alert("Unable to confirm payment amount with server. Please try again.");
        setProcessing(false);
        return;
      }
      // validate server amount equals requested amount
      if (serverAmountPaise !== amountInPaise) {
        console.error("Amount mismatch: requested paise:", amountInPaise, "server paise:", serverAmountPaise, orderData);
        alert(
          `Payment amount mismatch. Server created order for ₹${(serverAmountPaise / 100).toFixed(
            2
          )} but you should pay ₹${(amountInPaise / 100).toFixed(2)}. Please try again or contact support.`
        );
        setProcessing(false);
        return;
      }
      // load Razorpay and open checkout with server-confirmed amount & order_id
      await loadRazorpayScript();
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_RXBvSsz3XWbeok",
        amount: serverAmountPaise,
        currency,
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
              // clear pending purchase on success
              try {
                sessionStorage.removeItem(`pendingPurchase_${planId}`);
              } catch {}
              navigate(`/payment/success/${planId}`, {
                state: {
                  planName: result.planName,
                  paymentId:
                    result.razorpayPaymentId ||
                    response.razorpay_payment_id ||
                    "N/A",
                  paymentDate: result.paymentDate || new Date().toISOString(),
                  amountPaid: Number(effectiveAmount)?.toFixed(2), // :white_check_mark: pass paid amount
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
          {error || "Invalid plan ID"}
        </Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate("/explore/upgrade")}>
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
  const planDefaultPrice =
    plan.isDiscountActive && plan.discountedPrice < plan.totalPrice
      ? Number(plan.discountedPrice)
      : Number(plan.totalPrice);
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
        {/* Price display: show original price and "You pay" when different */}
        <Box mt={1}>
          {Number(effectiveAmount) !== Number(planDefaultPrice) ? (
            <>
              <Typography variant="body2" sx={{ color: "#666" }}>
                <s>₹{Number(planDefaultPrice).toFixed(2)}</s>
              </Typography>
              <Typography variant="h6" mt={0.5}>
                You pay: <strong>₹{Number(effectiveAmount).toFixed(2)}</strong>
              </Typography>
            </>
          ) : (
            <Typography variant="h6">₹{Number(planDefaultPrice).toFixed(2)}</Typography>
          )}
        </Box>
        <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#0033A0", "&:hover": { backgroundColor: "#00206B" } }}
            onClick={handleProceedToPay}
            disabled={processing}
          >
            {processing ? "Processing..." : "Proceed to Pay"}
          </Button>
          <Button variant="outlined" onClick={() => navigate("/explore/upgrade")}>
            Cancel
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};
export default PaymentConfirm;