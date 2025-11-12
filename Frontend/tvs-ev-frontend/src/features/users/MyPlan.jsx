// src/features/dashboard/MyPlan.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  ListItemText,
  CircularProgress,
  Divider,
  Chip,
  Grid,
  Stack,
  Avatar,
  useTheme,
  Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Cancel } from "@mui/icons-material";
import { useAuth } from "../auth/authContext";
import api from "/src/services/api.js";
import axios from "axios";
const MyPlan = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const fetchPlans = async () => {
      if (!user?.userId) return;
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Missing auth token. Please login again.");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        // Fetch user's plan orders
        const orderRes = await api.get(`/api/orders/${user.userId}/plans`, { headers });
        const plans = orderRes.data || [];
        if (plans.length === 0) {
          setPlan(null);
          return;
        }
        // Pick most recent plan
        const latestPlan = [...plans].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
        // Fetch plan details from Plan Service (use configured axios if you prefer)
        // NOTE: replace base URL with env var if you have one
        const planRes = await axios.get(
          `http://localhost:8081/api/v1/plans/${latestPlan.planId}`,
          { headers }
        );
        const combinedPlan = {
          ...planRes.data,
          startDate: latestPlan.startDate || latestPlan.createdAt,
          endDate: latestPlan.endDate,
        };
        setPlan(combinedPlan);
      } catch (err) {
        console.error("Error fetching plan details:", err);
        const msg =
          err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Failed to load plan details.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, [user]);
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }
  if (error) {
    return (
      <Box textAlign="center" mt={5}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  if (!plan) {
    return (
      <Box textAlign="center" mt={5}>
        <Typography variant="h6" color="text.secondary">
          No active or recent plans found.
        </Typography>
      </Box>
    );
  }
  // --- Helpers ---
  const calculateDaysLeft = (endDate) => {
    if (!endDate) return 0;
    const today = new Date();
    const end = new Date(endDate);
    const diff = end - today;
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
  };
  const getTotalDurationDays = (startDate, endDate, durationLabel) => {
    // Prefer exact start/end if provided, otherwise fallback to label
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      const diff = e - s;
      if (diff > 0) return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    if (!durationLabel) return 0;
    switch (durationLabel.toLowerCase()) {
      case "year":
      case "yearly":
        return 365;
      case "quarter":
      case "3 months":
      case "3_months":
        return 90;
      case "month":
      case "monthly":
        return 30;
      default:
        return 0;
    }
  };
  // --- Compute credit amount 'a' using TOTAL PRICE (as you specified):
  // a = daysLeft * totalPrice / totalDuration
  const daysLeft = calculateDaysLeft(plan.endDate);
  const totalDurationDays = getTotalDurationDays(plan.startDate, plan.endDate, plan.duration);
  const totalPrice = Number(plan.totalPrice ?? 0);
  const discountedPrice = Number(plan.discountedPrice ?? 0);  // use totalPrice per your formula
  const amountA = totalDurationDays ? (daysLeft * discountedPrice) / totalDurationDays : 0;
  return (
    <Box sx={{ p: 4, backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      <Typography variant="h4" fontWeight={700} gutterBottom color="primary">
        My Current Plan
      </Typography>
      <Paper
        elevation={4}
        sx={{
          p: 4,
          borderRadius: 3,
          background: "#fff",
          mb: 4,
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 56,
                height: 56,
                fontSize: 24,
                fontWeight: "bold",
              }}
            >
              {plan.name?.charAt(0)?.toUpperCase() || "P"}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={600}>
                {plan.name || plan.planName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {plan.description}
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={plan.isActive ? "Active" : "Inactive"}
            color={plan.isActive ? "success" : "error"}
            icon={plan.isActive ? <CheckCircle /> : <Cancel />}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
        <Divider sx={{ my: 2 }} />
        <Grid container spacing={2} mt={1}>
          <Grid item xs={12} sm={6} md={4}>
            <ListItemText primary="Duration" secondary={plan.duration || "—"} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            {/* show both total price and discounted price (if present) */}
            <ListItemText
              primary="Price"
              secondary={
                plan.discountedPrice
                  ? <>
                      <span style={{ textDecoration: "line-through", color: "#888" }}>
                        ₹{Number(plan.totalPrice ?? 0).toFixed(2)}
                      </span>{" "}
                      <span style={{ marginLeft: 8 }}>₹{Number(plan.discountedPrice).toFixed(2)}</span>
                    </>
                  : `₹${Number(plan.totalPrice ?? 0).toFixed(2)}`
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ListItemText
              primary="Start Date"
              secondary={plan.startDate ? new Date(plan.startDate).toLocaleDateString() : "—"}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <ListItemText
              primary="End Date"
              secondary={plan.endDate ? new Date(plan.endDate).toLocaleDateString() : "—"}
            />
          </Grid>
        </Grid>
        {/* --- Credit & Upgrade button row --- */}
        <Box mt={3} display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Days remaining: <strong>{daysLeft}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Credit from remaining period:{" "}
              <strong>₹{Number(amountA ?? 0).toFixed(2)}</strong>
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              onClick={() =>
                navigate("/explore/upgrade", {
                  state: {
                    currentPlan: plan,
                    creditAmount: amountA,
                  },
                })
              }
              sx={{
                backgroundColor: "#001F5B",
                color: "#fff",
                "&:hover": { backgroundColor: "#001240" },
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
              }}
            >
              Upgrade Plan
            </Button>
          </Box>
        </Box>
      </Paper>
      {Array.isArray(plan.features) && plan.features.length > 0 && (
        <Box>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Included Features
          </Typography>
          <Grid container spacing={3}>
            {plan.features.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    backgroundColor: "#F9FAFB",
                    transition: "0.2s",
                    "&:hover": { boxShadow: "0 4px 12px rgba(0,0,0,0.1)" },
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={600}>
                      {feature.name}
                    </Typography>
                    <Chip
                      label={feature.isActive ? "Active" : "Inactive"}
                      color={feature.isActive ? "success" : "error"}
                      size="small"
                    />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" mt={1} mb={2}>
                    {feature.description}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <ListItemText primary="Unit" secondary={feature.unit || "—"} />
                    </Grid>
                    <Grid item xs={6}>
                      <ListItemText primary="Usage Limit" secondary={feature.usageLimit ?? "—"} />
                    </Grid>
                    <Grid item xs={6}>
                      <ListItemText
                        primary="Default Included Units"
                        secondary={feature.defaultIncludedUnits ?? "—"}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <ListItemText
                        primary="Price per Unit"
                        secondary={
                          feature.pricePerUnit
                            ? `₹${feature.pricePerUnit.toFixed(2)}`
                            : "—"
                        }
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};
export default MyPlan;