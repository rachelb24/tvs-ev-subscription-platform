import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { login } from "./authService";
import { decodeToken } from "../../utils/jwtUtils";
import { useAuth } from "./authContext";
import {
  Box,
  Paper,
  TextField,
  Typography,
  Button,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [openForgot, setOpenForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const { setToken, setRole } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await login(email, password);
      setToken(res.token);
      setRole(res.role);

      const decoded = decodeToken(res.token);
      if (decoded?.sub) localStorage.setItem("email", decoded.sub);

      const params = new URLSearchParams(location.search);
      const redirect = params.get("redirect");
      if (redirect) navigate(redirect);
      else navigate(res.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return setMessage("Please enter your email.");
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:8083/api/users/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      if (!res.ok) throw new Error("Failed to send OTP.");
      setMessage("OTP sent successfully to your email.");
      setStep(2);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndReset = async () => {
    if (!otp || !newPassword)
      return setMessage("Please fill all required fields.");
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("http://localhost:8083/api/users/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, otp, newPassword }),
      });
      if (!res.ok) throw new Error("Failed to reset password.");
      const text = await res.text();
      setMessage(text || "Password reset successful. Please login.");
      setStep(3);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForgotDialog = () => {
    setForgotEmail("");
    setOtp("");
    setNewPassword("");
    setMessage("");
    setStep(1);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: `url("https://scontent-bom1-1.xx.fbcdn.net/v/t39.30808-6/481080848_956574623284539_8511559712812021116_n.jpg?stp=dst-jpg_s960x960_tt6&_nc_cat=104&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=yefjexFc46UQ7kNvwH7j0ow&_nc_oc=AdnWwNfHOJZ2SNC8Wqzch2vfq1V8eY6DKQsIsM0yDS_8sGtSIuisGlVKs7qyVN0rSJw&_nc_zt=23&_nc_ht=scontent-bom1-1.xx&_nc_gid=ny7Ol1LonO3pcUaPhncgYQ&oh=00_AfhIcjn81AiaoukIDKM0eSMgdipJ7KAwbIGC7XSJPhoS_A&oe=690D2413")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          width: 400,
          p: 5,
          borderRadius: 4,
          textAlign: "center",
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255,255,255,0.3)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.25)",
          color: "white",
        }}
      >
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>
          Welcome Back
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, opacity: 0.9 }}>
          Log in to continue your journey with TVS EV
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <Box component="form" onSubmit={handleSubmit} autoComplete="off" sx={{ mt: 2 }}>
          <Stack spacing={3}>
            <TextField
              label="Email"
              fullWidth
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(0,0,0,0.40)",
                  borderRadius: 2,
                },
                "& .MuiInputBase-input": { color: "white" },
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.85)" },
              }}
            />

            <TextField
              label="Password"
              fullWidth
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  backgroundColor: "rgba(0,0,0,0.40)",
                  borderRadius: 2,
                },
                "& .MuiInputBase-input": { color: "white" },
                "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.85)" },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                py: 1.3,
                borderRadius: 2,
                fontWeight: 700,
                backgroundColor: "#E31837",
                "&:hover": { backgroundColor: "#b51228" },
              }}
            >
              Login
            </Button>

            <Typography
              variant="body2"
              sx={{
                color: "white",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>
                Don’t have an account?{" "}
                <Button
                  variant="text"
                  sx={{ color: "#E31837", fontWeight: "bold" }}
                  onClick={() => navigate("/register")}
                >
                  Register
                </Button>
              </span>
              <Button
                variant="text"
                sx={{
                  color: "rgba(255,255,255,0.8)",
                  textTransform: "none",
                  fontSize: "0.9rem",
                }}
                onClick={() => setOpenForgot(true)}
              >
                Forgot password?
              </Button>
            </Typography>
          </Stack>
        </Box>
      </Paper>

      {/* === UPDATED FORGOT PASSWORD DIALOG === */}
      <Dialog
        open={openForgot}
        onClose={() => {
          setOpenForgot(false);
          resetForgotDialog();
        }}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            background: "rgba(255,255,255,0.14)",
            backdropFilter: "blur(20px)",
            borderRadius: 3,
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white",
            p: 2,
          },
        }}
      >
        <DialogTitle sx={{ textAlign: "center", fontWeight: 700 }}>
          Forgot Password
        </DialogTitle>

        <DialogContent sx={{ mt: 1 }}>
          {step === 1 && (
            <Stack spacing={2}>
              <TextField
                label="Enter your email"
                fullWidth
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(0,0,0,0.45)",
                    borderRadius: 2,
                  },
                  "& .MuiInputBase-input": { color: "white" },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.85)" },
                }}
              />
              <Button
                variant="contained"
                fullWidth
                disabled={loading}
                onClick={handleForgotPassword}
                sx={{ borderRadius: 2, py: 1, backgroundColor: "#E31837" }}
              >
                {loading ? <CircularProgress size={22} /> : "Send OTP"}
              </Button>
            </Stack>
          )}

          {step === 2 && (
            <Stack spacing={2}>
              <TextField
                label="Enter OTP"
                fullWidth
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(0,0,0,0.45)",
                    borderRadius: 2,
                  },
                  "& .MuiInputBase-input": { color: "white" },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.85)" },
                }}
              />

              <TextField
                label="New Password"
                type="password"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "rgba(0,0,0,0.45)",
                    borderRadius: 2,
                  },
                  "& .MuiInputBase-input": { color: "white" },
                  "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.85)" },
                }}
              />

              <Button
                variant="contained"
                fullWidth
                disabled={loading}
                onClick={handleVerifyOtpAndReset}
                sx={{ borderRadius: 2, py: 1, backgroundColor: "#E31837" }}
              >
                {loading ? <CircularProgress size={22} /> : "Verify & Reset Password"}
              </Button>
            </Stack>
          )}

          {step === 3 && (
            <Typography sx={{ textAlign: "center", mt: 2 }}>
              ✅ Password reset successful! Please login again.
            </Typography>
          )}

          {message && (
            <Typography sx={{ mt: 2, textAlign: "center", color: "#FFD" }}>
              {message}
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ justifyContent: "center" }}>
          <Button
            onClick={() => {
              setOpenForgot(false);
              resetForgotDialog();
            }}
            sx={{ color: "white" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Login;
