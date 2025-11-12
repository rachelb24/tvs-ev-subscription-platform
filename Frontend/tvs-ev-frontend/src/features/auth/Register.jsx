import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Paper,
  Typography,
  Alert,
  MenuItem,
} from "@mui/material";
import { register } from "./authService";
import { assignFreePlan } from "../../features/payments/paymentService";
import { useNavigate } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const vehicles = [
  {
    name: "TVS iQube",
    value: "TVS iQube",
    img:
      "https://www.tvsmotor.com/electric-scooters/tvs-iqube/-/media/Vehicles/Feature/Iqube/Variant/TVS-iQube-S/Color_Images/Copper-Bronze-Glossy/copper-bronze-c45-01.webp",
  },
  {
    name: "TVS X",
    value: "TVS X",
    img: "https://www.tvsmotor.com/U388_Assets/images/360images/28.webp",
  },
  {
    name: "TVS Orbiter",
    value: "TVS Orbiter",
    img:
      "https://www.tvsmotor.com/-/media/HomeOptimizedImages/TVS-Home-Page-WebP/Desktop/Vehicles/EV/TVS-Orbiter.webp",
  },
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 8 }, (_, i) => currentYear - i);

const Register = () => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    vehicleName: "",
    vehicleModelYear: "",
    vehicleNo: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mobileError, setMobileError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === "mobile") {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (value && !mobileRegex.test(value)) {
        setMobileError("Please enter a valid 10-digit Indian mobile number");
      } else {
        setMobileError("");
      }
    }
  };

  const handleSelectVehicle = (vehicle) => setForm({ ...form, vehicleName: vehicle.value });

  const handleVehicleNoBlur = () =>
    setForm((f) => ({ ...f, vehicleNo: (f.vehicleNo || "").trim().toUpperCase() }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (!form.vehicleNo) {
        setError("Please enter your vehicle registration number (e.g. KA01AB1234).");
        return;
      }

      const payload = {
        fullName: form.fullName,
        email: form.email,
        mobile: form.mobile,
        password: form.password,
        vehicleName: form.vehicleName || null,
        vehicleModelYear: form.vehicleModelYear ? Number(form.vehicleModelYear) : null,
        vehicleNo: (form.vehicleNo || "").trim().toUpperCase(),
      };

      const registerResp = await register(payload);
      let userId = registerResp?.userId;

      if (!userId) {
        try {
          const userResp = await fetch(
            `http://localhost:8083/api/users/by-email/${encodeURIComponent(form.email)}`,
            {
              headers: {
                Authorization: `Bearer ${registerResp.token || ""}`,
              },
            }
          );
          if (!userResp.ok) throw new Error("Failed to fetch userId");
          userId = (await userResp.text()).replace(/"/g, "");
        } catch (idErr) {
          console.error(idErr);
        }
      }

      try {
        if (userId) {
          const freePlanId = "34d63e2d-78e4-473d-8752-66d02686ebf9";
          await assignFreePlan(userId, freePlanId);
        }
      } catch {}

      setSuccess("Registered successfully! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);

    } catch (err) {
      let msg = err?.response?.data?.message || err?.message || "Registration failed.";
      if (msg.includes("already being used")) {
        msg = "This vehicle number is already being used. Please try a different one.";
      }
      setError(msg);
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3500,
    responsive: [{ breakpoint: 768, settings: { slidesToShow: 1 } }],
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
        elevation={10}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 520,
          borderRadius: 4,
          background: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(15px)",
          border: "1px solid rgba(255,255,255,0.3)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.25)",
          color: "white",
        }}
      >
        <Typography variant="h4" textAlign="center" sx={{ fontWeight: 700 }}>
          Create Account
        </Typography>
        <Typography variant="subtitle1" textAlign="center" sx={{ mb: 3, opacity: 0.9 }}>
          Join the TVS EV Family
        </Typography>

        <form onSubmit={handleSubmit} autoComplete="off">

          {/* Full Name */}
          <TextField
            label="Full Name"
            name="fullName"
            fullWidth
            margin="normal"
            value={form.fullName}
            onChange={handleChange}
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(0,0,0,0.40)",
                borderRadius: 2,
              },
              "& .MuiInputBase-input": { color: "white" },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.85)" },
            }}
          />

          {/* Email */}
          <TextField
            label="Email"
            name="email"
            fullWidth
            margin="normal"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(0,0,0,0.40)",
                borderRadius: 2,
              },
              "& .MuiInputBase-input": { color: "white" },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.85)" },
            }}
          />

          {/* Mobile Number */}
          <TextField
            label="Mobile Number"
            name="mobile"
            fullWidth
            margin="normal"
            value={form.mobile}
            onChange={handleChange}
            required
            error={!!mobileError}
            helperText={mobileError}
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(0,0,0,0.40)",
                borderRadius: 2,
              },
              "& .MuiInputBase-input": { color: "white" },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.85)" },
            }}
          />

          {/* Password */}
          <TextField
            label="Password"
            name="password"
            type="password"
            fullWidth
            margin="normal"
            value={form.password}
            onChange={handleChange}
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(0,0,0,0.40)",
                borderRadius: 2,
              },
              "& .MuiInputBase-input": { color: "white" },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.85)" },
            }}
          />

          <Typography variant="subtitle1" sx={{ mt: 3, fontWeight: 600 }}>
            Select Your EV Scooter
          </Typography>

          <Slider {...sliderSettings}>
            {vehicles.map((vehicle) => (
              <Box
                key={vehicle.value}
                sx={{
                  textAlign: "center",
                  cursor: "pointer",
                  p: 2,
                  borderRadius: 2,
                  border: form.vehicleName === vehicle.value ? "2px solid #E31837" : "2px solid transparent",
                  background: form.vehicleName === vehicle.value ? "rgba(227, 24, 55, 0.25)" : "rgba(255,255,255,0.10)",
                  transition: "0.3s",
                }}
                onClick={() => handleSelectVehicle(vehicle)}
              >
                <img
                  src={vehicle.img}
                  alt={vehicle.name}
                  style={{
                    width: "100%",
                    height: 120,
                    objectFit: "contain",
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                />
                <Typography variant="body1" color="white">{vehicle.name}</Typography>
              </Box>
            ))}
          </Slider>

          {/* Model Year */}
          <TextField
            label="Model Year"
            name="vehicleModelYear"
            select
            fullWidth
            margin="normal"
            value={form.vehicleModelYear}
            onChange={handleChange}
            required
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "rgba(0,0,0,0.40)",
                borderRadius: 2,
              },
              "& .MuiInputBase-input": { color: "white" },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.85)" },
            }}
          >
            {years.map((year) => (
              <MenuItem key={year} value={year}>{year}</MenuItem>
            ))}
          </TextField>

          {/* Vehicle Registration */}
          <TextField
            label="Vehicle Registration No (e.g. KA01AB1234)"
            name="vehicleNo"
            fullWidth
            margin="normal"
            value={form.vehicleNo}
            onChange={handleChange}
            onBlur={handleVehicleNoBlur}
            required
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
              mt: 3,
              py: 1.3,
              borderRadius: 2,
              fontWeight: 700,
              backgroundColor: "#E31837",
              "&:hover": { backgroundColor: "#B51228" },
            }}
          >
            Register
          </Button>
        </form>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}
      </Paper>
    </Box>
  );
};

export default Register;
