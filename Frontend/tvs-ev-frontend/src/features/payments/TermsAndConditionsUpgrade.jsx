import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Button,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { motion } from "framer-motion";
const TermsAndConditions = () => {
  const navigate = useNavigate();
  const { planId } = useParams();
  const location = useLocation();
  const incomingState = location.state || {}; // { adjustedPrice, isUpgrade, creditAmount, ... }
  const [termsText, setTermsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  useEffect(() => {
    fetch("/src/assets/terms/terms-and-conditions.txt")
      .then((res) => res.text())
      .then((text) => {
        setTermsText(text);
        setLoading(false);
      })
      .catch(() => {
        setTermsText("Failed to load Terms & Conditions. Please try again later.");
        setLoading(false);
      });
  }, []);
  const handleAgree = () => {
    if (!agreed) {
      alert("Please agree to the terms before proceeding.");
      return;
    }
    // Persist pending purchase so state survives login/refresh (per-tab)
    try {
      if (incomingState && Object.keys(incomingState).length > 0) {
        sessionStorage.setItem(
          `pendingPurchase_${planId}`,
          JSON.stringify({ ...incomingState, planId, agreedAt: new Date().toISOString() })
        );
      }
    } catch (e) {
      console.warn("sessionStorage write failed", e);
    }
    // Forward any incoming state to PaymentConfirm.
    navigate(`/payment/confirm/upgrade/${planId}`, {
      state: { ...incomingState, planId },
    });
  };
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="90vh"
      sx={{ background: "linear-gradient(to right, #F8FAFC, #EEF2FF)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: "100%", maxWidth: 800 }}
      >
        <Paper
          elevation={5}
          sx={{
            p: 4,
            borderRadius: 4,
            maxHeight: "80vh",
            overflowY: "auto",
            backgroundColor: "white",
            fontFamily: "'Courier New', monospace",
            fontSize: "0.85rem",
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
          }}
        >
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
              <CircularProgress color="primary" />
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {termsText}
            </Typography>
          )}
        </Paper>
        <Box display="flex" alignItems="center" justifyContent="space-between" mt={3}>
          <FormControlLabel
            control={
              <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)} color="success" />
            }
            label="I have read and agree to the Terms and Conditions"
          />
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#0033A0",
              "&:hover": { backgroundColor: "#00206B" },
              px: 3,
              py: 1,
            }}
            onClick={handleAgree}
          >
            Agree & Continue
          </Button>
        </Box>
      </motion.div>
    </Box>
  );
};
export default TermsAndConditions;