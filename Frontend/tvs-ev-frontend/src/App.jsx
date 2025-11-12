import React from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Box, Typography, Button } from "@mui/material";
import MapPage from "./features/users/MapPage";
import DealershipLocator from "./features/users/DealershipLocator";
import GlobalPresence from "./features/users/GlobalPresence";
import { AuthProvider } from "./features/auth/authContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/common/ProtectedRoute";
// Auth pages
import Login from "./features/auth/Login";
import Register from "./features/auth/Register";
// Payment pages
import PaymentSuccess from "./features/payments/PaymentSuccess";
import TermsAndConditions from "./features/payments/TermsAndConditions";
import PaymentConfirm from "./features/payments/PaymentConfirm";
import PaymentConfirmUpgrade from "./features/payments/PaymentConfirmUpgrade";
import TermsAndConditionsUpgrade from "./features/payments/TermsAndConditionsUpgrade";
// User pages
import Profile from "./features/users/Profile";
import MyPlan from "./features/users/MyPlan";
import MyOrders from "./features/users/MyOrders";
import UserDashboardHome from "./features/dashboard/DashboardHome";
// Explore
import ExplorePlansUpgrade from "./features/explorePlans/ExplorePlansUpgrade";
import ExplorePlans from "./features/explorePlans/ExplorePlans";
// Admin Dashboard
import AdminLayout from "./features/adminDashboard/AdminLayout.jsx";
import DashboardHome from "./features/adminDashboard/DashboardHome.jsx";
import FeaturesPage from "./features/adminDashboard/FeaturesPage.jsx";
import PlansPage from "./features/adminDashboard/PlansPage.jsx";
import UsersPage from "./features/adminDashboard/UsersPage.jsx";
import OrdersPage from "./features/adminDashboard/OrdersPage.jsx";
import PlanUsage from "./features/users/PlanUsage.jsx";
// ---------- HOME ----------
const Home = () => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* :movie_camera: Background Video */}
      <video
        key="bg-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={(e) => {
          const video = e.target;
          video
            .play()
            .catch((err) => console.warn("Autoplay blocked, retrying:", err));
        }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      >
        <source src="/videoplayback.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* :small_blue_diamond: Gradient Overlay */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)",
          zIndex: -1,
        }}
      />
      {/* :speech_balloon: Foreground Content */}
      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          textAlign: "center",
          px: 3,
        }}
      >
        <Typography
          variant="h2"
          fontWeight={700}
          sx={{
            mb: 2,
            fontSize: { xs: "2rem", md: "3.5rem" },
            textShadow: "0px 4px 25px rgba(0,0,0,0.7)",
            animation: "fadeInUp 1.5s ease-out",
            letterSpacing: "0.5px",
          }}
        >
          Powering the Future of Mobility 
        </Typography>
        <Typography
          variant="h6"
          sx={{
            mb: 4,
            maxWidth: "650px",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.9)",
            fontSize: { xs: "1rem", md: "1.2rem" },
            textShadow: "0px 3px 15px rgba(0,0,0,0.6)",
            animation: "fadeInUp 2s ease-out",
          }}
        >
          Experience the next era of electric mobility with{" "}
          <b>TVS EV Subscription</b> — explore, subscribe, and manage your EV
          journey seamlessly.
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => navigate("/explore")}
          sx={{
            borderRadius: "30px",
            px: 5,
            py: 1.4,
            fontWeight: 600,
            fontSize: "1.1rem",
            backgroundColor: "#0A4DA3",
            boxShadow: "0 4px 20px rgba(10,77,163,0.4)",
            textTransform: "none",
            animation: "fadeInUp 2.5s ease-out",
            "&:hover": {
              backgroundColor: "#083B7D",
              transform: "translateY(-3px)",
              boxShadow: "0 6px 25px rgba(10,77,163,0.6)",
            },
            transition: "all 0.3s ease",
          }}
        >
          Explore Plans
        </Button>
        <Typography
          variant="body2"
          sx={{
            position: "absolute",
            bottom: 25,
            color: "rgba(255,255,255,0.7)",
            fontSize: "0.9rem",
            letterSpacing: "0.3px",
          }}
        >
          © 2025 TVS Motor Company | Electric Mobility Division
        </Typography>
      </Box>
      {/* :sparkles: Fade-in animation */}
      <style>
        {`
          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(40px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  );
};
// ---------- OTHER SMALL PAGES ----------
const Unauthorized = () => (
  <Box p={5} textAlign="center">
    <Typography variant="h5" color="error">
      Unauthorized Access 
    </Typography>
  </Box>
);
const NotFound = () => (
  <Box p={5} textAlign="center">
    <Typography variant="h5" color="error">
      404 — Page Not Found
    </Typography>
  </Box>
);
// ---------- APP ----------
const App = () => (
  <Router>
    <AuthProvider>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#F8F9FB",
        }}
      >
        <Navbar />
        <Box component="main" sx={{ flex: 1 }}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<ExplorePlans />} />
            <Route path="/explore/upgrade" element={<ExplorePlansUpgrade />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dealerships" element={<DealershipLocator />} />
            <Route path="/global-presence" element={<GlobalPresence />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/payment/confirm/upgrade/:planId" element={<PaymentConfirmUpgrade />} />
            <Route path="/payment/success/:planId" element={<PaymentSuccess />} />
            <Route path="/payment/terms/:planId" element={<TermsAndConditions />} />
            <Route path="/map/:featureId" element={<MapPage />} />
            <Route path="/payment/terms/upgrade/:planId" element={<TermsAndConditionsUpgrade />} />
            <Route path="/payment/confirm/:planId" element={<PaymentConfirm />} />
            {/* Protected USER dashboard layout */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={["USER"]}>
                  <UserDashboardHome />
                </ProtectedRoute>
              }
            >
              <Route
                index
                element={
                  <Box p={3}>
                    <Typography variant="h5">Welcome to your Dashboard!</Typography>
                  </Box>
                }
              />
              <Route path="profile" element={<Profile />} />
              <Route path="myplan" element={<MyPlan />} />
              <Route path="planusage" element={<PlanUsage />} />
              <Route path="myorders" element={<MyOrders />} />
            </Route>
            {/* Protected ADMIN */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute roles={["ADMIN"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="features" element={<FeaturesPage />} />
              <Route path="plans" element={<PlansPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="orders" element={<OrdersPage />} />
            </Route>
            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Box>
        <Footer />
      </Box>
    </AuthProvider>
  </Router>
);
export default App;