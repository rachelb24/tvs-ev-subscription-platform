import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Stack,
  Select,
  MenuItem,
} from "@mui/material";
import { fetchAllOrders } from "../orderService";
import { fetchPlanById } from "../../planService";
import * as XLSX from "xlsx";
import "./index.css";
/**
 * Notes:
 * - Horizontal scroll is applied only to the outer Box with overflowX: 'auto'.
 * - Inner wrapper uses display: 'inline-block' + minWidth so scrollbar width matches table width.
 * - Export uses `filteredOrders` and exactly the `columns` displayed.
 */
export default function OrderTable() {
  const [rawOrders, setRawOrders] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  // UI state
  const [filterPlanName, setFilterPlanName] = useState("");
  const [filterUserName, setFilterUserName] = useState("");
  const [filterStartAfter, setFilterStartAfter] = useState(""); // yyyy-mm-dd
  const [filterEndBefore, setFilterEndBefore] = useState(""); // yyyy-mm-dd
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  // enriched orders (includes userName, planDetails, orderId, features string)
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const loadOrders = async () => {
    setDataLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetchAllOrders(token);
      const arr = Array.isArray(res) ? res : res?.data ?? [];
      setRawOrders(arr);
      // gather unique userIds and planIds
      const userIds = [...new Set(arr.map((o) => o.userId).filter(Boolean))];
      const planIds = [...new Set(arr.map((o) => o.planId).filter(Boolean))];
      // fetch users in parallel (cached via Map)
      const userMap = new Map();
      await Promise.all(
        userIds.map(async (uid) => {
          try {
            const userRes = await axios.get(
              `http://localhost:8083/api/users/by-id/${uid}`,
              { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            const maybeName = userRes?.data?.name ?? userRes?.data?.username ?? userRes?.data ?? uid;
            userMap.set(uid, maybeName);
          } catch (err) {
            console.warn("Failed user fetch", uid, err);
            userMap.set(uid, uid);
          }
        })
      );
      // fetch plans in parallel
      const planMap = new Map();
      await Promise.all(
        planIds.map(async (pid) => {
          try {
            const planRes = await fetchPlanById(pid, token);
            planMap.set(pid, planRes ?? {});
          } catch (err) {
            console.warn("Failed plan fetch", pid, err);
            planMap.set(pid, {});
          }
        })
      );
      // build enriched orders
      const enriched = arr.map((order) => {
        const orderId =
          order.id ??
          order.orderId ??
          order.orderID ??
          order.order_id ??
          (order.createdAt
            ? `${order.createdAt}-${String(order.userId ?? "").slice(0, 8)}`
            : "—");
        const userName = userMap.get(order.userId) ?? order.userName ?? order.userId ?? "—";
        const planDetails = planMap.get(order.planId) ?? {};
        const featuresList = Array.isArray(planDetails.features)
          ? planDetails.features.map((f) => f.name ?? f.featureName ?? "").join(", ")
          : order.features
          ? Array.isArray(order.features)
            ? order.features.map((f) => f.name ?? f.featureName ?? "").join(", ")
            : String(order.features)
          : "—";
        return {
          ...order,
          orderId,
          userName,
          planDetails,
          planFeaturesDisplay: featuresList,
        };
      });
      setOrders(enriched);
      setPage(1);
    } catch (e) {
      console.error("Error loading orders:", e);
    } finally {
      setDataLoading(false);
    }
  };
  // Columns definition: controls the table columns and the exact fields exported
  const columns = [
    { key: "orderId", label: "Order ID", value: (r) => r.orderId ?? "—" },
    { key: "userName", label: "User Name", value: (r) => r.userName ?? "—" },
    { key: "userId", label: "User ID", value: (r) => r.userId ?? "—" },
    { key: "planId", label: "Plan ID", value: (r) => r.planId ?? "—" },
    { key: "planName", label: "Plan Name", value: (r) => r.planDetails?.name ?? r.planName ?? "—" },
    {
      key: "description",
      label: "Description",
      value: (r) => r.planDetails?.description ?? "—",
      cellProps: { sx: { maxWidth: 300, whiteSpace: "normal", wordBreak: "break-word" } },
    },
    { key: "duration", label: "Duration", value: (r) => r.planDetails?.duration ?? "—" },
    {
      key: "features",
      label: "Features",
      value: (r) => r.planFeaturesDisplay ?? "—",
      cellProps: { sx: { maxWidth: 240, whiteSpace: "normal", wordBreak: "break-word" } },
    },
    {
      key: "totalPrice",
      label: "Total Price",
      value: (r) =>
        r.planDetails?.totalPrice != null ? `₹${r.planDetails.totalPrice}` : r.totalPrice != null ? `₹${r.totalPrice}` : "—",
    },
    {
      key: "discountedPrice",
      label: "Discounted Price",
      value: (r) => (r.planDetails?.discountedPrice != null ? `₹${r.planDetails.discountedPrice}` : r.discountedPrice != null ? `₹${r.discountedPrice}` : "—"),
    },
    { key: "discountPercentage", label: "Discount (%)", value: (r) => (r.planDetails?.discountPercentage != null ? `${r.planDetails.discountPercentage}%` : "—") },
    { key: "isDiscountActive", label: "Is Discount Active", value: (r) => (r.planDetails?.isDiscountActive ? "Yes" : "No") },
    { key: "isPlanActive", label: "Is Plan Active", value: (r) => (r.planDetails?.isActive ? "Yes" : "No") },
    { key: "startDate", label: "Start Date", value: (r) => (r.startDate ? new Date(r.startDate).toLocaleDateString() : "—") },
    { key: "endDate", label: "End Date", value: (r) => (r.endDate ? new Date(r.endDate).toLocaleDateString() : "—") },
    { key: "isOrderActive", label: "Is Order Active", value: (r) => (r.isActive ? "Yes" : "No") },
  ];
  // helper: normalize date string to yyyy-mm-dd (or null)
  const toYYYYMMDD = (d) => {
    if (!d) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    const dt = new Date(d);
    if (isNaN(dt)) return null;
    return dt.toISOString().slice(0, 10);
  };
  // Filters: filter orders client-side by plan name, user name, and start date range
  const filteredOrders = useMemo(() => {
    const startAfterNorm = toYYYYMMDD(filterStartAfter);
    const endBeforeNorm = toYYYYMMDD(filterEndBefore);
    return orders.filter((o) => {
      if (filterPlanName && !String(o.planDetails?.name ?? o.planName ?? "")
          .toLowerCase()
          .includes(filterPlanName.toLowerCase())
      ) return false;
      if (filterUserName && !String(o.userName ?? "")
          .toLowerCase()
          .includes(filterUserName.toLowerCase())
      ) return false;
      if (startAfterNorm) {
        if (!o.startDate) return false;
        const rowStart = toYYYYMMDD(o.startDate);
        if (!rowStart) return false;
        if (rowStart < startAfterNorm) return false;
      }
      if (endBeforeNorm) {
        if (!o.startDate) return false;
        const rowStart = toYYYYMMDD(o.startDate);
        if (!rowStart) return false;
        if (rowStart > endBeforeNorm) return false;
      }
      return true;
    });
  }, [orders, filterPlanName, filterUserName, filterStartAfter, filterEndBefore]);
  // pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / rowsPerPage));
  const pageData = filteredOrders.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  // Excel download of the **filteredOrders** and **only columns present in `columns` array**
  const handleDownloadXlsx = () => {
    try {
      const exportRows = filteredOrders.map((r) => {
        const obj = {};
        columns.forEach((col) => {
          const val = col.value(r);
          obj[col.label] = typeof val === "string" || typeof val === "number" ? val : String(val ?? "");
        });
        return obj;
      });
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orders");
      const filename = `orders_export_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error("Failed to export XLSX", err);
      alert("Failed to export Excel file.");
    }
  };
  const onClearFilters = () => {
    setFilterPlanName("");
    setFilterUserName("");
    setFilterStartAfter("");
    setFilterEndBefore("");
    setPage(1);
  };
  return (
    <Box sx={{ p: 3, overflowX: "hidden" }}>
      {/* Header */}
      <Typography variant="h5" sx={{ fontWeight: "bold", color: "primary.main", mb: 2 }}>
        All Orders
      </Typography>
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
          <TextField
            label="Plan Name"
            size="small"
            value={filterPlanName}
            onChange={(e) => { setFilterPlanName(e.target.value); setPage(1); }}
          />
          <TextField
            label="User Name"
            size="small"
            value={filterUserName}
            onChange={(e) => { setFilterUserName(e.target.value); setPage(1); }}
          />
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="caption">Start Date ≥</Typography>
            <input
              type="date"
              value={filterStartAfter}
              onChange={(e) => { setFilterStartAfter(e.target.value); setPage(1); }}
              style={{ height: 36, borderRadius: 4, border: "1px solid #ccc", padding: "0 8px" }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Typography variant="caption">End Date ≤</Typography>
            <input
              type="date"
              value={filterEndBefore}
              onChange={(e) => { setFilterEndBefore(e.target.value); setPage(1); }}
              style={{ height: 36, borderRadius: 4, border: "1px solid #ccc", padding: "0 8px" }}
            />
          </Box>
          <Button variant="outlined" onClick={onClearFilters}>Clear</Button>
          <Box sx={{ ml: "auto", display: "flex", gap: 1, alignItems: "center" }}>
  <Typography variant="caption">Rows</Typography>
  <Select
    size="small"
    value={rowsPerPage}
    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(1); }}
  >
    <MenuItem value={5}>5</MenuItem>
    <MenuItem value={10}>10</MenuItem>
    <MenuItem value={25}>25</MenuItem>
    <MenuItem value={50}>50</MenuItem>
  </Select>
  <Button
    variant="contained"
    color="primary"
    onClick={handleDownloadXlsx}
    sx={{ ml: 1 }}
  >
    Download Report
  </Button>
</Box>
        </Stack>
      </Paper>
      {/* Loader / Empty */}
      {dataLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
          <CircularProgress />
        </Box>
      ) : filteredOrders.length === 0 ? (
        <Typography variant="body1" align="center" sx={{ mt: 4 }}>
          No orders found.
        </Typography>
      ) : (
        <>
          {/* :white_check_mark: Scrollable Table Only */}
          {/* :white_check_mark: Scrollable Table Only */}
<div className="table-scroll-wrapper">
  <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 3 }}>
    <Table sx={{ width: "max-content", tableLayout: "auto" }}>
      <TableHead>
        <TableRow sx={{ backgroundColor: "#F5F5F5" }}>
          {columns.map((col) => (
            <TableCell
              key={col.key}
              sx={{
                fontWeight: "bold",
                whiteSpace: "nowrap",
                ...(col.headProps?.sx ?? {}),
              }}
            >
              {col.label}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {pageData.map((row, idx) => (
          <TableRow
            key={row.orderId ?? idx}
            hover
            sx={{
              "&:hover": { backgroundColor: "#F0F7FF" },
              transition: "background-color 0.2s ease",
            }}
          >
            {columns.map((col) => (
              <TableCell key={col.key} {...(col.cellProps ?? {})}>
                {col.value(row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
</div>
        </>
      )}
      {/* Pagination Controls */}
{filteredOrders.length > 0 && (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      mt: 3,
      gap: 2,
    }}
  >
    <Button
      variant="outlined"
      disabled={page <= 1}
      onClick={() => setPage((p) => Math.max(1, p - 1))}
    >
      Previous
    </Button>
    <Typography variant="body2">
      Page {page} of {totalPages}
    </Typography>
    <Button
      variant="outlined"
      disabled={page >= totalPages}
      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
    >
      Next
    </Button>
  </Box>
)}
    </Box>
  );
}