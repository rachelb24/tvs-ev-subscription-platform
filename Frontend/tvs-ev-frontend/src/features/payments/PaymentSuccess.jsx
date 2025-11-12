// src/features/payments/PaymentSuccess.jsx
import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  CircularProgress,
  Chip,
  Paper,
} from "@mui/material";
import { CheckCircleOutline } from "@mui/icons-material";
import { getPlanById } from "../explorePlans/explorePlansService";
const PaymentSuccess = () => {
  const { planId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const paymentId = state?.paymentId || "N/A";
  const paymentDate = state?.paymentDate ? new Date(state.paymentDate).toLocaleString() : "Unknown";
  useEffect(() => {
    const loadPlan = async () => {
      try {
        const data = await getPlanById(planId);
        setPlan(data);
      } catch (error) {
        console.error("Failed to load plan details:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPlan();
  }, [planId]);
  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="70vh">
        <CircularProgress />
      </Box>
    );
  const getDurationLabel = (duration) => {
    switch (duration?.toUpperCase()) {
      case "YEAR":
        return "Yearly";
      case "MONTH":
        return "Monthly";
      case "QUARTER":
        return "Quarterly";
      default:
        return duration || "";
    }
  };
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="85vh" px={2} sx={{ background: "#F9FAFC" }}>
      <Paper
        elevation={8}
        sx={{ p: 5, borderRadius: 4, width: "100%", maxWidth: 720, textAlign: "center", background: "white" }}
      >
        <CheckCircleOutline sx={{ fontSize: 70, color: "success.main", mb: 2 }} />
        <Typography variant="h4" fontWeight={600} gutterBottom>
          Payment Successful!
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Thank you for your purchase! Your subscription is now active.
        </Typography>
        <Divider sx={{ my: 3 }} />
        {/* Plan Details */}
        {plan && (
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Plan Details
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {plan.name} ({getDurationLabel(plan.duration)})
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                {plan.description}
              </Typography>
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                {plan.features?.map((f) => (
                  <Chip key={f.featureId} label={`${f.name}: ${f.defaultIncludedUnits} units`} size="small" />
                ))}
              </Stack>
              <Typography variant="h6" mt={2}>
                ₹
                {plan.isDiscountActive && plan.discountedPrice < plan.totalPrice
                  ? plan.discountedPrice
                  : plan.totalPrice}
              </Typography>
            </CardContent>
          </Card>
        )}
        {/* :white_check_mark: Payment Summary */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Payment Summary
            </Typography>
            <Stack spacing={1} alignItems="center">
              <Typography>
                <strong>Payment ID:</strong> {paymentId}
              </Typography>
              <Typography>
                <strong>Plan ID:</strong> {planId}
              </Typography>
              <Typography>
                <strong>Status:</strong>{" "}
                <Chip label="Success" color="success" size="small" />
              </Typography>
              <Typography color="text.secondary">
                <strong>Date:</strong> {paymentDate}
              </Typography>
            </Stack>
          </CardContent>
        </Card>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="center" spacing={2} mt={4}>
          <Button
            variant="contained"
            sx={{ backgroundColor: "#0033A0", "&:hover": { backgroundColor: "#00206B" } }}
            onClick={() => navigate("/dashboard/myplan")}
          >
            View My Plans
          </Button>
          <Button variant="outlined" onClick={() => navigate("/")}>
            Go Home
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};
export default PaymentSuccess;