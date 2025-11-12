import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  IconButton,
  useMediaQuery,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
} from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useNavigate } from "react-router-dom";
import { fetchPlans } from "./explorePlansService";
import { useAuth } from "../auth/authContext";
import api from "/src/services/api.js";
import axios from "axios";

const TVS_BLUE = "#001F5B";
const TVS_RED = "#E31837";
const FREE_GREEN = "#2ECC71";

const ExplorePlans = () => {
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [showCarousel, setShowCarousel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedPlans, setExpandedPlans] = useState({});
  const [filters, setFilters] = useState({ planType: "All", duration: "All" });
  const carouselRef = useRef(null);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const { user } = useAuth();

  const [currentPlan, setCurrentPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [planError, setPlanError] = useState("");
  const [creditAmount, setCreditAmount] = useState(0);

  // --- Fetch plans ---
  useEffect(() => {
    const getPlans = async () => {
      try {
        const data = await fetchPlans();

        // ✅ Remove free plans here
        const nonFree = (data || []).filter((p) => p.totalPrice !== 0);

        setPlans(nonFree);
        setFilteredPlans(nonFree);
      } catch (err) {
        console.error("Error fetching plans:", err);
      } finally {
        setLoading(false);
      }
    };
    getPlans();
  }, []);

  // --- Fetch user's current plan ---
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      setPlanLoading(true);
      setPlanError("");
      try {
        if (!user?.userId) {
          setPlanLoading(false);
          return;
        }
        const token = localStorage.getItem("token");
        if (!token) throw new Error("Missing auth token.");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };
        const orderRes = await api.get(`/api/orders/${user.userId}/plans`, { headers });
        const plansOrders = orderRes.data || [];
        if (plansOrders.length === 0) {
          setCurrentPlan(null);
          setPlanLoading(false);
          return;
        }
        const latestPlanOrder = [...plansOrders].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0];
        const planRes = await axios.get(
          `http://localhost:8081/api/v1/plans/${latestPlanOrder.planId}`,
          { headers }
        );
        const combined = {
          ...planRes.data,
          startDate: latestPlanOrder.startDate || latestPlanOrder.createdAt,
          endDate: latestPlanOrder.endDate,
        };
        setCurrentPlan(combined);

        const calculateDaysLeft = (endDate) => {
          if (!endDate) return 0;
          const today = new Date();
          const end = new Date(endDate);
          return Math.max(Math.ceil((end - today) / (1000 * 60 * 60 * 24)), 0);
        };

        const getTotalDurationDays = (startDate, endDate, durationLabel) => {
          if (startDate && endDate) {
            const diff = new Date(endDate) - new Date(startDate);
            if (diff > 0) return Math.ceil(diff / (1000 * 60 * 60 * 24));
          }
          switch (durationLabel?.toLowerCase()) {
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

        const daysLeft = calculateDaysLeft(combined.endDate);
        const totalDurationDays = getTotalDurationDays(
          combined.startDate,
          combined.endDate,
          combined.duration
        );
        const discountedPrice = Number(combined.discountedPrice ?? combined.totalPrice ?? 0);
        setCreditAmount(totalDurationDays ? (daysLeft * discountedPrice) / totalDurationDays : 0);
      } catch (err) {
        setPlanError(err.response?.data?.message || err.message || "Failed to load current plan.");
      } finally {
        setPlanLoading(false);
      }
    };
    fetchCurrentPlan();
  }, [user]);

  // --- Filtering ---
  useEffect(() => {
    let filtered = [...plans];

    if (filters.planType !== "All") {
      filtered = filtered.filter(
        (p) => p.name?.toLowerCase() === filters.planType.toLowerCase()
      );
    }

    if (filters.duration !== "All") {
      filtered = filtered.filter((p) =>
        getDurationLabel(p).toLowerCase().includes(filters.duration.toLowerCase())
      );
    }

    setFilteredPlans(filtered);
  }, [filters, plans]);

  const handleBuyNow = (planId) => {
    const token = localStorage.getItem("token");
    if (token) navigate(`/payment/terms/${planId}`);
    else navigate(`/login?redirect=${encodeURIComponent(`/payment/terms/${planId}`)}`);
  };

  const CARD_WIDTH = 320;
  const scrollLeft = () => carouselRef.current?.scrollBy({ left: -(CARD_WIDTH + 24), behavior: "smooth" });
  const scrollRight = () => carouselRef.current?.scrollBy({ left: CARD_WIDTH + 24, behavior: "smooth" });
  const toggleView = () => setShowCarousel(!showCarousel);

  const toggleExpand = (id) =>
    setExpandedPlans((prev) => ({ ...prev, [id]: !prev[id] }));

  const renderPrice = (plan) => {
    const { totalPrice, discountedPrice, isDiscountActive } = plan;
    if (isDiscountActive && discountedPrice < totalPrice) {
      const discountPercent = Math.round(((totalPrice - discountedPrice) / totalPrice) * 100);
      return (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6">
            <s style={{ color: "#888", marginRight: 6 }}>₹{totalPrice}</s> ₹{discountedPrice}
          </Typography>
          <Chip
            label={`${discountPercent}% OFF`}
            size="small"
            sx={{ backgroundColor: "rgba(227,24,55,0.1)", color: TVS_RED, fontWeight: 600 }}
          />
        </Stack>
      );
    }
    return <Typography variant="h6">₹{totalPrice}</Typography>;
  };

  const getDurationLabel = (plan) => {
    switch (plan.duration?.toUpperCase()) {
      case "YEAR":
        return "Yearly";
      case "QUARTER":
        return "3 Months";
      case "MONTH":
        return "Monthly";
      default:
        return "";
    }
  };

  const renderFilterChips = () => {
    const chips = [];
    if (filters.duration !== "All")
      chips.push({ key: "duration", label: `Duration: ${filters.duration}` });
    if (filters.planType !== "All")
      chips.push({ key: "planType", label: `Plan: ${filters.planType}` });

    if (!chips.length) return null;
    return (
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
        {chips.map((chip) => (
          <Chip
            key={chip.key}
            label={chip.label}
            onDelete={() => setFilters((f) => ({ ...f, [chip.key]: "All" }))}
            sx={{ backgroundColor: "rgba(0,31,91,0.08)", color: TVS_BLUE, fontWeight: 500 }}
          />
        ))}
        <Chip
          label="Clear All"
          onClick={() => setFilters({ planType: "All", duration: "All" })}
          sx={{ backgroundColor: "rgba(227,24,55,0.1)", color: TVS_RED, fontWeight: 600 }}
        />
      </Stack>
    );
  };

  // ✅ FilterBar placed correctly (do NOT move)
  const FilterBar = () => (
    <Paper elevation={1} sx={{ p: 1.25, display: "inline-block", borderRadius: 2, mb: 1 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Duration</InputLabel>
          <Select
            label="Duration"
            value={filters.duration}
            onChange={(e) => setFilters((f) => ({ ...f, duration: e.target.value }))}
          >
            {["All", "Monthly", "3 Months", "Yearly"].map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Autocomplete
          size="small"
          options={["All", "Basic", "Advanced"]} // ✅ Free removed from dropdown too
          value={filters.planType}
          onChange={(_, val) => setFilters((f) => ({ ...f, planType: val }))}
          sx={{ width: 180 }}
          renderInput={(params) => <TextField {...params} label="Plan name" />}
        />
      </Stack>
      {renderFilterChips()}
    </Paper>
  );

  const renderPlanCard = (plan) => {
    const isExpanded = expandedPlans[plan.planId];
    const visibleFeatures = isExpanded ? plan.features : plan.features?.slice(0, 3) || [];
    return (
      <Card
        key={plan.planId}
        sx={{
          width: CARD_WIDTH,
          height: 420,
          borderRadius: 3,
          boxShadow: 3,
          background: "linear-gradient(to bottom, #F2F2F2 0%, #FFFFFF 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "0.3s",
          "&:hover": { transform: "translateY(-6px)", boxShadow: 6 },
        }}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" color={TVS_RED} fontWeight={600}>
            {plan.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={1}>
            {getDurationLabel(plan)}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            mb={2}
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: 5,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {plan.description}
          </Typography>
          <Box
            sx={{
              maxHeight: isExpanded ? 120 : 90,
              overflowY: isExpanded ? "auto" : "hidden",
              pr: 0.5,
            }}
          >
            <Stack spacing={1} alignItems="start" mb={1}>
              {visibleFeatures.map((f) => (
                <Chip
                  key={f.featureId}
                  label={`${f.name}: ${f.defaultIncludedUnits} units`}
                  size="small"
                  sx={{
                    fontSize: "0.8rem",
                    backgroundColor: "rgba(0,0,0,0.05)",
                    "&:hover": {
                      backgroundColor: "rgba(0,31,91,0.1)",
                      transform: "translateY(-2px)",
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>

          {plan.features?.length > 3 && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ cursor: "pointer", textDecoration: "underline" }}
              onClick={() => toggleExpand(plan.planId)}
            >
              {isExpanded ? "Show less" : `+${plan.features.length - 3} more`}
            </Typography>
          )}

          {renderPrice(plan)}
        </CardContent>

        <CardActions>
          <Button
            variant="contained"
            fullWidth
            sx={{ borderRadius: 2, backgroundColor: TVS_BLUE, "&:hover": { backgroundColor: "#001240" } }}
            onClick={() => handleBuyNow(plan.planId)}
          >
            Buy Now
          </Button>
        </CardActions>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const groupedPlans = filteredPlans.reduce((groups, plan) => {
    const name = plan.name?.trim() || "Misc";
    if (!groups[name]) groups[name] = [];
    groups[name].push(plan);
    return groups;
  }, {});
  const planOrder = ["Basic", "Advanced"];
  const groupedPlanEntries = Object.entries(groupedPlans).sort(
    ([a], [b]) => planOrder.indexOf(a) - planOrder.indexOf(b)
  );

  return (
    <Box sx={{ textAlign: "center", py: 6, px: { xs: 2, sm: 4, md: 8 }, backgroundColor: "#F8F9FA", minHeight: "100vh" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Box textAlign="left">
          <Typography variant="h4" fontWeight={600} mb={1} sx={{ color: TVS_BLUE }}>
            Explore Subscription Plans
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Choose the plan that best fits your driving needs!
          </Typography>
        </Box>

        <Box textAlign="right">
          {planLoading ? (
            <CircularProgress size={24} />
          ) : (
            <Button
              variant="contained"
              onClick={() =>
                navigate("/explore/upgrade", { state: { currentPlan, creditAmount } })
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
          )}
          {planError && (
            <Typography variant="caption" color="error" mt={1} display="block">
              {planError}
            </Typography>
          )}
        </Box>
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
        <FilterBar />
      </Box>

      {!showCarousel ? (
        <>
          {groupedPlanEntries.map(([planType, plansArray]) => (
            <Box key={planType} mb={6}>
              <Typography
                variant="h5"
                sx={{
                  color: TVS_BLUE,
                  mb: 3,
                  backgroundColor: "rgba(0,31,91,0.08)",
                  px: 3,
                  py: 1,
                  borderRadius: "12px",
                  fontWeight: 600,
                }}
              >
                {planType} Plans
              </Typography>

              <Grid container spacing={3} justifyContent="center">
                {plansArray.map((plan) => (
                  <Grid item key={plan.planId}>
                    {renderPlanCard(plan)}
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}

          {filteredPlans.length > 3 && (
            <Button
              onClick={toggleView}
              sx={{
                mt: 4,
                borderRadius: 2,
                px: 3,
                py: 1,
                backgroundColor: TVS_BLUE,
                color: "white",
                "&:hover": { backgroundColor: "#001240" },
              }}
            >
              View Carousel
            </Button>
          )}
        </>
      ) : (
        <Box position="relative" mt={3}>
          <IconButton
            onClick={scrollLeft}
            sx={{
              position: "absolute",
              left: 0,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "white",
              "&:hover": { backgroundColor: "#001240" },
              zIndex: 2,
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>

          <Box
            ref={carouselRef}
            sx={{
              display: "flex",
              overflowX: "auto",
              scrollBehavior: "smooth",
              gap: 3,
              px: 6,
              py: 3,
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {filteredPlans.map((plan) => (
              <Box key={plan.planId} sx={{ flex: "0 0 auto" }}>
                {renderPlanCard(plan)}
              </Box>
            ))}
          </Box>

          <IconButton
            onClick={scrollRight}
            sx={{
              position: "absolute",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              backgroundColor: "rgba(0,0,0,0.5)",
              color: "white",
              "&:hover": { backgroundColor: "#001240" },
              zIndex: 2,
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>

          <Button
            onClick={toggleView}
            sx={{
              mt: 3,
              borderRadius: 2,
              px: 3,
              py: 1,
              backgroundColor: TVS_BLUE,
              color: "white",
              "&:hover": { backgroundColor: "#001240" },
            }}
          >
            View Grid
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ExplorePlans;
