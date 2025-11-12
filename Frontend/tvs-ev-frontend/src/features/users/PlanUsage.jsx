// src/pages/planusage/PlanUsage.jsx
import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
} from "@mui/material";
import {
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Place as PlaceIcon,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartTooltip,
  Legend,
} from "recharts";
import { decodeToken } from "../../utils/jwtUtils";
import { useNavigate } from "react-router-dom";

export default function PlanUsage() {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [featureHistory, setFeatureHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const decoded = decodeToken(token);
  const email = decoded?.sub || null;

  const fetchUserAndUsage = async () => {
    if (!token || !email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const userRes = await fetch(`http://localhost:8083/api/users/by-email/${email}`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!userRes.ok) throw new Error("User not found");
      let userId = (await userRes.text()).replace(/"/g, "");

      const subRes = await fetch(`http://localhost:8083/api/subscriptions/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const subs = await subRes.json();
      const activeSub = subs.find((s) => s.isActive) || subs[subs.length - 1];
      if (!activeSub?.id) throw new Error("No active subscription");

      setSubscriptionId(activeSub.id);

      const usageRes = await fetch(
        `http://localhost:8083/api/plan-usage/${activeSub.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const usage = await usageRes.json();
      setUsageData(Array.isArray(usage) ? usage : []);
    } catch (err) {
      console.error(err);
      setUsageData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAndUsage();
  }, []);

  const handleViewHistory = (feature) => {
    setSelectedFeature(feature);
    fetchFeatureHistory(feature.featureName);
  };

  const fetchFeatureHistory = async (featureName) => {
    if (!token || !subscriptionId) return;
    setHistoryLoading(true);
    try {
      const resp = await fetch(
        `http://localhost:8083/api/plan-usage/${subscriptionId}/feature/${encodeURIComponent(
          featureName
        )}/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const history = await resp.json();
      setFeatureHistory(Array.isArray(history) ? history : []);
    } catch (err) {
      console.error(err);
      setFeatureHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistory = () => {
    setSelectedFeature(null);
    setFeatureHistory([]);
  };

  const handleBookFeature = (feature) => {
    const used = Number(feature.usedUnits ?? 0);
    const total = Number(feature.totalUnits ?? 0);
    if (used >= total) {
      alert(
        `Usage limit reached for "${feature.featureName}". Please purchase additional units.`
      );
      return;
    }
    navigate(`/map/${encodeURIComponent(feature.featureName)}`, {
      state: { subscriptionId, featureName: feature.featureName, usedUnits: used, totalUnits: total },
    });
  };

  // Format data for chart
  const chartData = usageData.map((f) => {
    const used = Number(f.usedUnits ?? 0);
    const total = Number(f.totalUnits ?? 0);
    const remaining = Math.max(0, total - used);
    const usedPercent = total > 0 ? (used / total) * 100 : 0;
    const remainingPercent = 100 - usedPercent;
    return { name: f.featureName, used, remaining, usedPercent, remainingPercent };
  });

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Plan Usage
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchUserAndUsage} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : usageData.length === 0 ? (
        <Card sx={{ p: 3, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="body1" color="textSecondary">
            No usage data found for this subscription.
          </Typography>
        </Card>
      ) : (
        <>
          {/* Usage Table */}
          <Card sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
            <CardContent>
              <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: "hidden" }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "#f9fafb" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Feature Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Used Units</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Total Units</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Progress</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {usageData.map((feature, i) => {
                      const used = Number(feature.usedUnits ?? 0);
                      const total = Number(feature.totalUnits ?? 0);
                      const progress = total > 0 ? (used / total) * 100 : 0;
                      const isFull = used >= total;
                      return (
                        <TableRow key={i} sx={{ "&:hover": { backgroundColor: "#f5f5f5" } }}>
                          <TableCell>{feature.featureName}</TableCell>
                          <TableCell>{used}</TableCell>
                          <TableCell>{total}</TableCell>
                          <TableCell>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={Math.min(progress, 100)}
                                sx={{
                                  flexGrow: 1,
                                  height: 8,
                                  borderRadius: 5,
                                  "& .MuiLinearProgress-bar": { backgroundColor: "#0a4da3" },
                                  backgroundColor: "#d6d6d6",
                                }}
                              />
                              <Typography variant="body2" sx={{ minWidth: 40 }}>
                                {Math.round(progress)}%
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="View History">
                              <IconButton onClick={() => handleViewHistory(feature)} color="primary">
                                <HistoryIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip
                              title={
                                isFull ? (
                                  <Typography variant="body2" color="error.main" fontWeight={600}>
                                    Usage limit reached
                                  </Typography>
                                ) : (
                                  "Book / Use Feature"
                                )
                              }
                            >
                              <span>
                                <IconButton
                                  color={isFull ? "default" : "secondary"}
                                  onClick={() => !isFull && handleBookFeature(feature)}
                                  disabled={isFull}
                                >
                                  <PlaceIcon />
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

{/* ✅ Feature Usage Comparison Chart */}
<Card sx={{ mt: 4, p: 3, borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
    Feature Usage Comparison
  </Typography>

  <Box sx={{ height: 320 }}>
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 10, right: 30, left: 70, bottom: 10 }}
      >
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          dataKey="name"
          type="category"
          width={160}
          tick={{ fontSize: 13, fill: "#333" }}
        />

        {/* ✅ Custom Tooltip (clean display) */}
        <RechartTooltip
          content={({ payload }) => {
            if (!payload || payload.length === 0) return null;
            const data = payload[0].payload;
            
            const used = data.used;
            const remaining = data.remaining;

            // dynamic used color
            const usedColor =
              data.usedPercent >= 100 ? "#d32f2f" : 
              data.usedPercent >= 65 ? "#ffb300" : "#0a4da3";

            return (
              <Box sx={{
                background: "#fff",
                p: 1.5,
                borderRadius: 1,
                boxShadow: "0 2px 10px rgba(0,0,0,0.12)"
              }}>
                <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                  {data.name}
                </Typography>
                <Typography sx={{ color: usedColor, fontWeight: 600 }}>
                  Used: {used} units
                </Typography>
                <Typography sx={{ color: "#6c757d", fontWeight: 500 }}>
                  Remaining: {remaining} units
                </Typography>
              </Box>
            );
          }}
        />

        {/* ✅ Clean Legend */}
        <Legend
          formatter={(value) =>
            value === "usedPercent" ? "Used Units" : "Remaining Units"
          }
          payload={[
            { id: "used", type: "square", value: "Used Units", color: "#0a4da3" },
            { id: "remaining", type: "square", value: "Remaining Units", color: "#d6d6d6" }
          ]}
        />

        {/* 🎨 Dynamic Used Bar Color */}
        <Bar
          dataKey="usedPercent"
          name="Used Units"
          stackId="usage"
          barSize={30}
          radius={[4, 0, 0, 4]}
          isAnimationActive={true}
          fill={({ usedPercent }) =>
            usedPercent >= 100 ? "#d32f2f" : // 🔥 RED when full
            usedPercent >= 65 ? "#ffb300" : // 🟡 YELLOW warning
            "#0a4da3"                       // 💙 BLUE normal
          }
        />

        {/* 🩶 Remaining Portion */}
        <Bar
          dataKey="remainingPercent"
          name="Remaining Units"
          stackId="usage"
          fill="#d6d6d6"
          barSize={30}
          radius={[0, 4, 4, 0]}
          isAnimationActive={true}
        />
      </BarChart>
    </ResponsiveContainer>
  </Box>
</Card>

        </>
      )}

      {/* History Modal */}
      <Dialog open={!!selectedFeature} onClose={handleCloseHistory} maxWidth="sm" fullWidth>
        <DialogTitle>Usage History — {selectedFeature?.featureName}</DialogTitle>
        <DialogContent dividers>
          {historyLoading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          ) : featureHistory.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              No usage history found.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Units Used</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {featureHistory.map((h, i) => (
                  <TableRow key={i}>
                    <TableCell>{new Date(h.usedAt).toLocaleString()}</TableCell>
                    <TableCell>{h.unitsUsed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistory} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
