// src/features/dashboard/UpgradePlans.jsx
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
import { useNavigate, useLocation } from "react-router-dom";
import { fetchPlans } from "./explorePlansService"; // keep path as your project expects
import { useAuth } from "../auth/authContext";
const TVS_BLUE = "#001F5B";
const TVS_RED = "#E31837";
const FREE_GREEN = "#2ECC71";
const CARD_WIDTH = 320;
const UpgradePlans = () => {
  const [plans, setPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [showCarousel, setShowCarousel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedPlans, setExpandedPlans] = useState({});
  const [filters, setFilters] = useState({ planType: "All", duration: "All" });
  const carouselRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:600px)");
  const { token } = useAuth();
  // current plan + credit (sent from MyPlan via navigate(..., { state: { currentPlan, creditAmount } }))
  const currentPlan = location.state?.currentPlan ?? null;
  const creditAmount = Number(location.state?.creditAmount ?? 0);
  // --- Fetch plans from backend ---
  useEffect(() => {
    const getPlans = async () => {
      try {
        const data = await fetchPlans();
        const all = data || [];
        setPlans(all);
        // If upgrade flow (currentPlan present), filter only those with totalPrice > currentPlan.totalPrice
        if (currentPlan && (currentPlan.totalPrice ?? currentPlan.discountedPrice ?? 0) >= 0) {
          const currentTotal = Number(currentPlan.totalPrice ?? 0);
          const eligible = all.filter((p) => Number(p.totalPrice ?? 0) > currentTotal);
          setFilteredPlans(eligible);
        } else {
          setFilteredPlans(all);
        }
      } catch (err) {
        console.error("Error fetching plans:", err);
        setFilteredPlans([]);
      } finally {
        setLoading(false);
      }
    };
    getPlans();
  }, [currentPlan]);
  // --- Apply local UI Filters (plan name/duration) to whatever filteredPlans currently holds ---
  useEffect(() => {
    let filtered = [...plans];
    // if upgrade mode, start from only eligible plans
    if (currentPlan) {
      const currentTotal = Number(currentPlan.totalPrice ?? 0);
      filtered = filtered.filter((p) => Number(p.totalPrice ?? 0) > currentTotal);
    }
    if (filters.planType && filters.planType !== "All") {
      filtered = filtered.filter(
        (p) => p.name?.toLowerCase() === filters.planType.toLowerCase()
      );
    }
    if (filters.duration && filters.duration !== "All") {
      filtered = filtered.filter((p) => {
        const durationLabel = getDurationLabel(p).toLowerCase();
        return durationLabel.includes(filters.duration.toLowerCase());
      });
    }
    setFilteredPlans(filtered);
  }, [filters, plans, currentPlan]);
  // --- Pricing helpers ---
  const getBasePrice = (plan) =>
    plan.isDiscountActive && plan.discountedPrice ? Number(plan.discountedPrice) : Number(plan.totalPrice ?? 0);
  const getAdjustedPrice = (plan) => {
    const base = getBasePrice(plan);
    const adjusted = Math.max(base - creditAmount, 0);
    return Number(adjusted.toFixed(2));
  };
  // --- Navigation to payment (upgrade flow) ---
  const handleBuyNow = (planId, adjustedPrice) => {
    const token = localStorage.getItem("token");
    if (token) {
      // pass purchase metadata so payment flow can show correct amount & treat as upgrade
      navigate(`/payment/terms/upgrade/${planId}`, {
        state: { adjustedPrice, isUpgrade: !!currentPlan, creditAmount },
      });
    } else {
      const redirectPath = encodeURIComponent(`/payment/terms/upgrade/${planId}`);
      navigate(`/login?redirect=${redirectPath}`);
    }
  };
  // --- Carousel Controls ---
  const scrollLeft = () => {
    if (carouselRef.current)
      carouselRef.current.scrollBy({ left: -(CARD_WIDTH + 24), behavior: "smooth" });
  };
  const scrollRight = () => {
    if (carouselRef.current)
      carouselRef.current.scrollBy({ left: CARD_WIDTH + 24, behavior: "smooth" });
  };
  const toggleView = () => setShowCarousel(!showCarousel);
  // --- Expand/collapse individual plan ---
  const toggleExpand = (planId) => {
    setExpandedPlans((prev) => ({ ...prev, [planId]: !prev[planId] }));
  };
  // --- UI helpers (price rendering / duration) ---
  const renderPrice = (plan) => {
    const totalPrice = Number(plan.totalPrice ?? 0);
    const discountedPrice = Number(plan.discountedPrice ?? 0);
    const isDiscountActive = !!plan.isDiscountActive && discountedPrice > 0;
    if (totalPrice === 0) {
      return (
        <Chip
          label="Free Plan"
          size="medium"
          sx={{
            mt: 1.5,
            fontWeight: 600,
            fontSize: "1rem",
            backgroundColor: "rgba(0, 184, 148, 0.1)",
            color: FREE_GREEN,
            border: `1px solid ${FREE_GREEN}`,
            borderRadius: "8px",
          }}
        />
      );
    }
    if (isDiscountActive && discountedPrice < totalPrice) {
      const discountPercent = Math.round(((totalPrice - discountedPrice) / totalPrice) * 100);
      return (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6">
            <s style={{ color: "#888", marginRight: 6 }}>₹{totalPrice.toFixed(2)}</s> ₹
            {discountedPrice.toFixed(2)}
          </Typography>
          <Chip
            label={`${discountPercent}% OFF`}
            size="small"
            sx={{
              backgroundColor: "rgba(227,24,55,0.1)",
              color: TVS_RED,
              fontWeight: 600,
            }}
          />
        </Stack>
      );
    }
    return <Typography variant="h6">₹{totalPrice.toFixed(2)}</Typography>;
  };
  const getDurationLabel = (plan) => {
    if (!plan.duration) return "";
    switch ((plan.duration || "").toUpperCase()) {
      case "YEAR":
      case "YEARLY":
        return "Yearly";
      case "QUARTER":
        return "3 Months";
      case "MONTH":
      case "MONTHLY":
        return "Monthly";
      default:
        return "";
    }
  };
  // --- Group plans by name for grid sections (re-uses filteredPlans) ---
  const groupedPlans = filteredPlans.reduce((groups, plan) => {
    const baseName = plan.name?.trim() || "Misc";
    if (!groups[baseName]) groups[baseName] = [];
    groups[baseName].push(plan);
    return groups;
  }, {});
  const planOrder = ["Free", "Basic", "Advanced"];
  const groupedPlanEntries = Object.entries(groupedPlans).sort(([a], [b]) => {
    const indexA = planOrder.indexOf(a);
    const indexB = planOrder.indexOf(b);
    return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }
  // --- Filter Chips UI ---
  const renderFilterChips = () => {
    const chips = [];
    if (filters.duration && filters.duration !== "All") {
      chips.push({
        label: `Duration: ${filters.duration}`,
        key: "duration",
      });
    }
    if (filters.planType && filters.planType !== "All") {
      chips.push({
        label: `Plan: ${filters.planType}`,
        key: "planType",
      });
    }
    if (chips.length === 0) return null;
    return (
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
        {chips.map((chip) => (
          <Chip
            key={chip.key}
            label={chip.label}
            onDelete={() => setFilters((prev) => ({ ...prev, [chip.key]: "All" }))}
            sx={{ backgroundColor: "rgba(0, 31, 91, 0.08)", color: TVS_BLUE, fontWeight: 500 }}
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
  const FilterBar = () => (
    <Paper elevation={1} sx={{ p: 1.25, display: "inline-block", borderRadius: 2, mb: 1, textAlign: "left" }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="duration-label">Duration</InputLabel>
          <Select
            labelId="duration-label"
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
          options={["All", "Free", "Basic", "Advanced"]}
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
    const adjustedPrice = getAdjustedPrice(plan);
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
          <Box sx={{ maxHeight: isExpanded ? 120 : 90, overflowY: isExpanded ? "auto" : "hidden", pr: 0.5 }}>
            <Stack spacing={1} alignItems="start" mb={1}>
              {visibleFeatures.map((f) => (
                <Chip
                  key={f.featureId}
                  label={`${f.name}: ${f.defaultIncludedUnits} units`}
                  size="small"
                  sx={{
                    fontSize: "0.8rem",
                    backgroundColor: "rgba(0,0,0,0.05)",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      backgroundColor: "rgba(0, 31, 91, 0.1)",
                      transform: "translateY(-2px)",
                      boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.1)",
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
              align="left"
              sx={{ cursor: "pointer", textDecoration: "underline", display: "block", mt: 0.5, "&:hover": { color: TVS_BLUE } }}
              onClick={() => toggleExpand(plan.planId)}
            >
              {isExpanded ? "Show less" : `+${plan.features.length - 3} more`}
            </Typography>
          )}
          {renderPrice(plan)}
          {/* show adjusted price if in upgrade flow */}
          {currentPlan && (
            <Typography variant="subtitle1" mt={1}>
              You pay: <strong>₹{adjustedPrice.toFixed(2)}</strong>
            </Typography>
          )}
        </CardContent>
        {plan.name?.toLowerCase() !== "free" && (
          <CardActions>
            <Button
              variant="contained"
              fullWidth
              sx={{ borderRadius: 2, backgroundColor: TVS_BLUE, "&:hover": { backgroundColor: "#001240" } }}
              onClick={() => handleBuyNow(plan.planId, adjustedPrice)}
            >
              {currentPlan ? `Upgrade for ₹${adjustedPrice.toFixed(2)}` : "Buy Now"}
            </Button>
          </CardActions>
        )}
      </Card>
    );
  };
  return (
    <Box sx={{ textAlign: "center", py: 6, px: { xs: 2, sm: 4, md: 8 }, backgroundColor: "#F8F9FA", minHeight: "100vh" }}>
      <Typography variant="h4" fontWeight={600} mb={1} sx={{ color: TVS_BLUE }}>
        {currentPlan ? "Upgrade Subscription" : "Explore Subscription Plans"}
      </Typography>
      {currentPlan ? (
        <Typography variant="body1" color="text.secondary" mb={4}>
          Credit from remaining period: <strong>₹{creditAmount.toFixed(2)}</strong>. Only plans with higher total price than your current plan (₹{Number(currentPlan.totalPrice ?? 0).toFixed(2)}) are shown.
        </Typography>
      ) : (
        <Typography variant="body1" color="text.secondary" mb={4}>
          Choose the plan that best fits your driving needs!
        </Typography>
      )}
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
                  backgroundColor: "rgba(0, 31, 91, 0.08)",
                  display: "inline-block",
                  px: 3,
                  py: 1,
                  borderRadius: "12px",
                  backdropFilter: "blur(4px)",
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
            <Button onClick={toggleView} sx={{ mt: 4, borderRadius: 2, px: 3, py: 1, backgroundColor: TVS_BLUE, color: "white", "&:hover": { backgroundColor: "#001240" } }}>
              View Carousel
            </Button>
          )}
        </>
      ) : (
        <Box position="relative" mt={3}>
          <IconButton onClick={scrollLeft} sx={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", backgroundColor: "rgba(0, 0, 0, 0.5)", color: "white", "&:hover": { backgroundColor: "#001240" }, zIndex: 2 }}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Box ref={carouselRef} sx={{ display: "flex", overflowX: "auto", scrollBehavior: "smooth", gap: 3, px: 6, py: 3, "&::-webkit-scrollbar": { display: "none" } }}>
            {filteredPlans.map((plan) => (
              <Box key={plan.planId} sx={{ flex: "0 0 auto" }}>
                {renderPlanCard(plan)}
              </Box>
            ))}
          </Box>
          <IconButton onClick={scrollRight} sx={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", backgroundColor: "rgba(0, 0, 0, 0.5)", color: "white", "&:hover": { backgroundColor: "#001240" }, zIndex: 2 }}>
            <ArrowForwardIosIcon />
          </IconButton>
          <Button onClick={toggleView} sx={{ mt: 3, borderRadius: 2, px: 3, py: 1, backgroundColor: TVS_BLUE, color: "white", "&:hover": { backgroundColor: "#001240" } }}>
            View Grid
          </Button>
        </Box>
      )}
    </Box>
  );
};
export default UpgradePlans;