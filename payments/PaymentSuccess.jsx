import React, { useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Box, Typography, Button, Paper } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { motion } from "framer-motion";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { planId } = useParams();
  const { planName, paymentId } = location.state || {};

  // ⏳ Auto redirect after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard"); // or "/" for home page
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="80vh"
      px={2}
    >
      <Paper
        elevation={6}
        sx={{
          p: 6,
          borderRadius: 4,
          width: "100%",
          maxWidth: 520,
          textAlign: "center",
          background: "rgba(255, 255, 255, 0.95)",
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <CheckCircleOutlineIcon
            sx={{ fontSize: 80, color: "success.main", mb: 2 }}
          />
        </motion.div>

        <Typography variant="h4" fontWeight={600} gutterBottom>
          Payment Successful!
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Your plan <strong>{planName || "Subscription Plan"}</strong> has been
          successfully activated.
        </Typography>

        {paymentId && (
          <Typography variant="body2" color="text.secondary">
            Payment ID: <strong>{paymentId}</strong>
          </Typography>
        )}

        <Button
          variant="contained"
          sx={{
            mt: 4,
            backgroundColor: "#0033a0",
            "&:hover": { backgroundColor: "#00206b" },
          }}
          onClick={() => navigate("/dashboard")}
        >
          Go to Dashboard
        </Button>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Redirecting you automatically in a few seconds...
        </Typography>
      </Paper>
    </Box>
  );
};

export default PaymentSuccess;
