import React, { useEffect, useState } from "react";
import { Box, Typography, Alert } from "@mui/material";
import axios from "axios";
import DataTable from "./components/common/DataTable";
import { useAuth } from "../../features/auth/authContext";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAuth();

  // ✅ Fetch users from backend
  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8083/api/users/all", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users. Please check your permissions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
  }, [token]);

  // ✅ Soft Delete user (set isActive = false)
  const handleSoftDelete = async (user) => {
    const confirm = window.confirm(
      `Deactivate user "${user.fullName}"? They will no longer be active, but not removed.`
    );
    if (!confirm) return;

    try {
      await axios.put(
        `http://localhost:8083/api/users/${user.userId}`,
        { ...user, isActive: false },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh list
      fetchUsers();
    } catch (err) {
      console.error("Error deactivating user:", err);
      alert("Failed to deactivate user.");
    }
  };

  // ✅ Table columns (no edit column now)
  const columns = [
    { field: "userId", headerName: "User ID" },
    { field: "fullName", headerName: "Full Name" },
    { field: "email", headerName: "Email" },
    { field: "mobile", headerName: "Mobile" },
    { field: "vehicleName", headerName: "Vehicle" },
    { field: "vehicleModelYear", headerName: "Model Year" },
    { field: "isActive", headerName: "Active" },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        All Users
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <DataTable
        columns={columns}
        rows={users.map((u) => ({
          ...u,
          isActive: u.isActive ? "Yes" : "No",
        }))}

        // ❌ Remove Add user
        onAdd={undefined}

        // ❌ Remove Edit user
        onEdit={undefined}

        // ✅ Custom Soft Delete Handler
        onDelete={handleSoftDelete}

        loading={loading}
      />
    </Box>
  );
};

export default UsersPage;
