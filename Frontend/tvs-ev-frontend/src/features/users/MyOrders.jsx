import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Grid,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import axios from "axios";
import { useAuth } from "../auth/authContext";

const MyOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const res = await axios.get(
          `http://localhost:8083/api/orders/${user.userId}/plans`,
          { headers }
        );
        const data = res.data || [];

        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setOrders(sorted);
        setCurrentPlanId(sorted[0]?.planId || null);
      } catch (err) {
        console.error("Error fetching orders:", err);
        const msg =
          err.response?.data?.message ||
          err.response?.data ||
          err.message ||
          "Failed to load orders.";
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={10}>
        <CircularProgress />
      </Box>
    );

  if (error)
    return (
      <Typography color="error" textAlign="center" mt={5}>
        {error}
      </Typography>
    );

  if (orders.length === 0)
    return (
      <Box textAlign="center" mt={5}>
        <Typography variant="h6" color="text.secondary">
          No past orders found.
        </Typography>
      </Box>
    );

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom color="primary">
        My Orders
      </Typography>

      <Grid container direction="column" spacing={3}>

        {orders.map((order, index) => {
          const isActive = order.planId === currentPlanId;
          const statusLabel = isActive ? "Active" : "Completed";

          return (
            <Grid item xs={12} key={index}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  background: "#fff",
                  transition: "0.2s",
                  "&:hover": { boxShadow: "0 6px 20px rgba(0,0,0,0.12)" },
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <ReceiptLongIcon color="primary" />
                  <Typography variant="h6" fontWeight={600}>
                    {order.planName || "EV Plan"}
                  </Typography>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Plan Description: {order.description}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Duration: {order.duration}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Order ID: {order.id}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Created At: {new Date(order.createdAt).toLocaleDateString()}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Total Price(₹): {order.totalPrice}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Discounted Price(₹): {order.discountedPrice}
                </Typography>

                <Stack direction="row" alignItems="center" spacing={1} mt={1}>
                  <Typography variant="body2" color="text.secondary">
                    Status:
                  </Typography>
                  <Chip
                    label={statusLabel}
                    color={isActive ? "success" : "default"}
                    size="small"
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default MyOrders;
