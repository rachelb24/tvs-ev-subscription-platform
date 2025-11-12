import React, { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Stack,
  Paper,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import EventIcon from "@mui/icons-material/Event";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ListAltIcon from "@mui/icons-material/ListAlt";
import { fetchProfile } from "../users/userService";
import { useAuth } from "../auth/authContext";
import api from "/src/services/api.js";
import axios from "axios";

// ------------------ Overview Component ------------------
const DashboardOverview = ({ profile }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => {
    let intervalId;

    const fetchActivePlan = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Missing auth token. Please login again.");

        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        // :one: Fetch user's plans (from ORDER SERVICE via gateway)
        const orderRes = await api.get(`/api/orders/${user.userId}/plans`, {
          headers,
        });
        const plans = orderRes.data || [];
        if (plans.length === 0) {
          setPlan(null);
          return;
        }

        // :two: Pick most recent plan
        const latestPlan = [...plans].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0];

        // :three: Fetch detailed plan info (direct call to PLAN SERVICE)
        const planRes = await axios.get(
          `http://localhost:8081/api/v1/plans/${latestPlan.planId}`,
          { headers }
        );

        const fullPlan = { ...planRes.data, ...latestPlan };
        setPlan(fullPlan);

        // :four: Function to calculate remaining days
        const calculateDaysLeft = () => {
          if (!fullPlan.endDate) {
            setDaysLeft(null);
            return;
          }
          const today = new Date();
          const expiry = new Date(fullPlan.endDate);
          const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
          setDaysLeft(diff > 0 ? diff : 0);
        };

        // Run initially + set interval to recalc every 24h
        calculateDaysLeft();
        intervalId = setInterval(calculateDaysLeft, 24 * 60 * 60 * 1000);
      } catch (err) {
        console.error("Error fetching active plan:", err);
        const msg =
          err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Failed to load active plan.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };

    fetchActivePlan();

    // Cleanup interval on unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [user]);

  if (loading)
    return (
      <Box sx={{ textAlign: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Alert severity="error" sx={{ mt: 3 }}>
        {error}
      </Alert>
    );

  return (
    <>
      {/* Hero Section */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          background: "linear-gradient(135deg, #E3F2FD, #FFF)",
          borderRadius: 3,
          p: 4,
          mt: 2,
          boxShadow: 2,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 280 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Welcome back, {profile?.fullName || "User"}!
          </Typography>
          <Typography variant="body1" color="text.secondary" mb={3}>
            Here’s your personalized dashboard where you can manage your EV plans,
            track subscriptions, and update your profile.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<DashboardIcon />}
              sx={{ textTransform: "none", borderRadius: 2 }}
              component={Link}
              to="/dashboard/myplan"
            >
              View My Plan
            </Button>

            {/* 🧾 View All Orders */}
            <Button
              variant="outlined"
              startIcon={<ListAltIcon />}
              sx={{ textTransform: "none", borderRadius: 2 }}
              onClick={() => navigate("/dashboard/myorders")}
            >
              View All Orders
            </Button>
          </Stack>
        </Box>

        <Box
          component="img"
          src="/undraw_on-the-way_zwi3.svg"
          alt="Dashboard illustration"
          sx={{
            width: 260,
            maxWidth: "100%",
            mt: { xs: 3, sm: 0 },
          }}
        />
      </Box>

      {/* Metrics Section */}
      <Grid container spacing={3} mt={3}>
        {/* Active Plan */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              gap: 2,
              boxShadow: 2,
            }}
          >
            <BoltIcon color="primary" />
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Active Plan
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {plan?.name || "No Active Plan"}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Plan Expiry */}
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 2,
              boxShadow: 2,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <EventIcon color="error" />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Plan Expiry
                </Typography>
                <Typography variant="h6" fontWeight={600}>
                  {plan?.endDate || "—"}
                </Typography>
              </Box>
            </Stack>

            {/* Countdown */}
            {daysLeft !== null && (
              <Box
                sx={{
                  backgroundColor:
                    daysLeft <= 10 ? "rgba(255,0,0,0.1)" : "rgba(0,128,0,0.1)",
                  color: daysLeft <= 10 ? "error.main" : "success.main",
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  minWidth: 90,
                  textAlign: "center",
                }}
              >
                {daysLeft} days left
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

// ------------------ Main Dashboard ------------------
const UserDashboardHome = () => {
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile()
      .then((data) => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load user details");
        setLoading(false);
      });
  }, []);

  if (loading)
    return (
      <Box sx={{ textAlign: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        User Dashboard
      </Typography>

      {/* Navigation Buttons */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: 3,
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          mb: 3,
        }}
      >
        <Stack direction="row" spacing={2}>
          <Button
            component={Link}
            to="/dashboard"
            variant={location.pathname === "/dashboard" ? "contained" : "outlined"}
            sx={{ borderRadius: 2 }}
          >
            Overview
          </Button>

          <Button
            component={Link}
            to="/dashboard/profile"
            variant={
              location.pathname.includes("/dashboard/profile")
                ? "contained"
                : "outlined"
            }
            sx={{ borderRadius: 2 }}
          >
            Profile
          </Button>

          <Button
            component={Link}
            to="/dashboard/myplan"
            variant={
              location.pathname.includes("/dashboard/myplan")
                ? "contained"
                : "outlined"
            }
            sx={{ borderRadius: 2 }}
          >
            My Plan
          </Button>

          <Button
            component={Link}
            to="/dashboard/planusage"
            variant={
              location.pathname.includes("/dashboard/planusage")
                ? "contained"
                : "outlined"
            }
            sx={{ borderRadius: 2 }}
          >
            Plan Usage
          </Button>

          <Button
            component={Link}
            to="/dashboard/myorders"
            variant={
              location.pathname.includes("/dashboard/myorders")
                ? "contained"
                : "outlined"
            }
            sx={{ borderRadius: 2 }}
          >
            My Orders
          </Button>
        </Stack>
      </Paper>

      {/* Overview or Nested Route */}
      {location.pathname === "/dashboard" ? (
        <DashboardOverview profile={profile} />
      ) : (
        <Outlet />
      )}
    </Box>
  );
};

export default UserDashboardHome;
