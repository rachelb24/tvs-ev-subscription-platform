import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Box,
  Grid,
  Card,
  Typography,
  IconButton,
  Tooltip,
  Divider,
  ClickAwayListener,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import dayjs from "dayjs";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const DashboardHome = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalOrders: 0,
    activeOrders: 0,
    totalPlans: 0,
    totalFeatures: 0,
  });
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const calendarRef = useRef(null);
  const toggleCalendar = () => setShowCalendar((prev) => !prev);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error(":x: No token found. Please log in first.");
          return;
        }
        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        };
        const urls = {
          users: "http://localhost:8083/api/users/count",
          orders: "http://localhost:8083/api/orders/count",
          plans: "http://localhost:8081/api/v1/plans/count",
          features: "http://localhost:9001/api/v1/features/count",
        };
        const [usersRes, ordersRes, plansRes, featuresRes] = await Promise.all([
          axios.get(urls.users, config),
          axios.get(urls.orders, config),
          axios.get(urls.plans, config),
          axios.get(urls.features, config),
        ]);
        setStats({
          totalUsers: usersRes.data.totalUsers || 0,
          activeUsers: usersRes.data.activeUsers || 0,
          inactiveUsers: usersRes.data.inactiveUsers || 0,
          totalOrders: ordersRes.data.totalOrders || 0,
          activeOrders: ordersRes.data.activeOrders || 0,
          totalPlans: plansRes.data.count || 0,
          totalFeatures: featuresRes.data.count || 0,
        });
      } catch (error) {
        console.error(":x: Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  // --- derived mock chart data ---
  const orderData = [
    { month: "Jan", orders: 500, average: 600 },
    { month: "Feb", orders: 520, average: 600 },
    { month: "Mar", orders: 750, average: 600 },
    { month: "Apr", orders: 640, average: 600 },
    { month: "May", orders: 800, average: 600 },
    { month: "Jun", orders: 750, average: 600 },
    { month: "Jul", orders: 850, average: 600 },
    { month: "Aug", orders: 950, average: 600 },
    { month: "Sep", orders: 700, average: 600 },
    { month: "Oct", orders: 650, average: 600 },
    { month: "Nov", orders: 900, average: 600 },
    { month: "Dec", orders: 1100, average: 600 },
  ];

  const planData = [
    { name: "Basic", value: stats.totalPlans * 0.5 },
    { name: "Standard", value: stats.totalPlans * 0.3 },
    { name: "Premium", value: stats.totalPlans * 0.2 },
  ];

  const COLORS = ["#0A4DA3", "#E31837", "#2E7D32"];

  return (
    <Box sx={{ p: 3, width: "100%", bgcolor: "#F8F9FA", minHeight: "100vh" }}>
      {/* ===== HEADER ===== */}
      <Grid
        container
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Grid item>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {selectedDate.format("dddd, MMMM D, YYYY")}
          </Typography>
        </Grid>
        <Grid item>
          <Tooltip title="Toggle Calendar">
            <IconButton
              onClick={toggleCalendar}
              sx={{
                bgcolor: "#001F5B",
                color: "#fff",
                "&:hover": { bgcolor: "#0A4DA3" },
              }}
            >
              <CalendarMonthIcon />
            </IconButton>
          </Tooltip>
        </Grid>
      </Grid>

      {/* Floating calendar */}
      {showCalendar && (
        <ClickAwayListener onClickAway={() => setShowCalendar(false)}>
          <Box
            ref={calendarRef}
            sx={{
              position: "absolute",
              right: 30,
              top: 80,
              zIndex: 10,
              boxShadow: 4,
              borderRadius: 2,
              bgcolor: "white",
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                value={selectedDate}
                onChange={(newValue) => setSelectedDate(newValue)}
              />
            </LocalizationProvider>
          </Box>
        </ClickAwayListener>
      )}

      <Divider sx={{ my: 3 }} />

      {/* ===== SUMMARY CARDS ===== */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {[
          { label: "Total Users", value: stats.totalUsers, color: "#0A4DA3" },
          { label: "Active Users", value: stats.activeUsers, color: "#2E7D32" },
          {
            label: "Inactive Users",
            value: stats.inactiveUsers,
            color: "#E31837",
          },
          { label: "Total Orders", value: stats.totalOrders, color: "#0277BD" },
          { label: "Active Orders", value: stats.activeOrders, color: "#FF8B00" },
          { label: "Total Plans", value: stats.totalPlans, color: "#6F42C1" },
          {
            label: "Total Features",
            value: stats.totalFeatures,
            color: "#D63384",
          },
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} lg={3} key={index}>
            <Card
              sx={{
                p: 2,
                boxShadow: 3,
                borderLeft: `6px solid ${stat.color}`,
                borderRadius: 3,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {stat.label}
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                {stat.value}
              </Typography>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ===== CHARTS SECTION (STACKED) ===== */}
      <Grid
        container
        direction="column"
        spacing={3}
        sx={{
          alignItems: "stretch",
        }}
      >
        

        {/* Orders Trend (Full Width, Below Pie) */}
        <Grid item xs={12}>
          <Card sx={{ p: 4, boxShadow: 4, borderRadius: 3 }}>
            <Typography
              variant="h6"
              align="center"
              sx={{ fontWeight: 600, mb: 3 }}
            >
              Orders Trend (Full Year)
            </Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={orderData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
                <XAxis dataKey="month" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#0A4DA3"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 8 }}
                />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="#FF5733"
                  strokeWidth={2}
                  dasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome;
