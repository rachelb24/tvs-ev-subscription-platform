// :white_check_mark: Vehicle No made non-editable — minimal change only
import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  TextField,
  Button,
  Snackbar,
  IconButton,
  Stack,
} from "@mui/material";
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";
import CloseIcon from "@mui/icons-material/Close";
import LockIcon from "@mui/icons-material/Lock";
import { fetchProfile, updateProfile } from "./userService";
import { useAuth } from "../auth/authContext";
import api from "/src/services/api.js";
import axios from "axios";

const vehicles = [
  { name: "TVS Orbiter", img: "https://www.tvsmotor.com/-/media/HomeOptimizedImages/TVS-Home-Page-WebP/Desktop/Vehicles/EV/TVS-Orbiter.webp" },
  { name: "TVS iQube", img: "https://www.tvsmotor.com/electric-scooters/tvs-iqube/-/media/Vehicles/Feature/Iqube/Variant/TVS-iQube-S/Color_Images/Copper-Bronze-Glossy/copper-bronze-c45-01.webp" },
  { name: "TVS X", img: "https://www.tvsmotor.com/U388_Assets/images/360images/28.webp" },
];

const containerStyle = {
  borderRadius: "20px",
  backdropFilter: "blur(14px)",
  boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
  border: "1px solid rgba(255,255,255,0.35)",
  maxWidth: 820,
  margin: "60px auto",
  overflow: "hidden",
};

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [view, setView] = useState("info");
  const [isEditing, setIsEditing] = useState(false);
  const [editedMobile, setEditedMobile] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [plan, setPlan] = useState(null);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    fetchProfile().then(setProfile).catch(() => setError("Failed to load profile"));
  }, []);

  useEffect(() => {
    const fetchPlan = async () => {
      if (!user) return;
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      const orders = await api.get(`/api/orders/${user.userId}/plans`, { headers });
      const list = orders.data || [];
      if (!list.length) return;
      const latest = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      const p = await axios.get(`http://localhost:8081/api/v1/plans/${latest.planId}`, { headers });
      setPlan({ ...p.data, ...latest });
    };
    fetchPlan();
  }, [user]);

  if (error) return <Alert severity="error">{error}</Alert>;
  if (!profile) return <Box sx={{ mt: 10, textAlign: "center" }}><CircularProgress /></Box>;

  const vehicle = vehicles.find(v => v.name === profile.vehicleName);

  const saveMobile = async () => {
    const updated = await updateProfile({ ...profile, mobile: editedMobile });
    setProfile(updated);
    setSnackbarMsg("Profile updated successfully!");
    setSnackbarOpen(true);
    setIsEditing(false);
  };

  return (
    <Paper elevation={10} sx={containerStyle}>

      {/* HERO */}
      <Box sx={{
        textAlign: "center",
        py: 5,
        background: "linear-gradient(135deg, #0A2342, #1E3A8A)",
        color: "white"
      }}>
        <Avatar sx={{ width: 90, height: 90, bgcolor: "#ffffff33", backdropFilter: "blur(4px)", margin: "0 auto", fontSize: "2rem", fontWeight: 700 }}>
          {profile.fullName?.charAt(0)}
        </Avatar>
        <Typography variant="h4" fontWeight={700} sx={{ mt: 2 }}>{profile.fullName}</Typography>
        <Typography sx={{ opacity: 0.8 }}>{profile.email}</Typography>
        <Chip label={profile.isActive ? "Active" : "Inactive"} color={profile.isActive ? "success" : "error"} sx={{ mt: 1 }} />
      </Box>

      {/* UNDERLINE TABS */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
        <Box sx={{ display: "flex", gap: 4 }}>
          <Typography
            onClick={() => setView("info")}
            sx={{
              cursor: "pointer", pb: 1, fontWeight: 600,
              color: view === "info" ? "#1E3A8A" : "gray",
              borderBottom: view === "info" ? "3px solid #1E3A8A" : "3px solid transparent"
            }}>
            <PersonIcon sx={{ mr: 1 }} /> User Info
          </Typography>

          <Typography
            onClick={() => setView("vehicle")}
            sx={{
              cursor: "pointer", pb: 1, fontWeight: 600,
              color: view === "vehicle" ? "#1E3A8A" : "gray",
              borderBottom: view === "vehicle" ? "3px solid #1E3A8A" : "3px solid transparent"
            }}>
            <TwoWheelerIcon sx={{ mr: 1 }} /> Vehicle
          </Typography>
        </Box>
      </Box>

      {/* USER INFO VIEW */}
      {view === "info" && (
        <Box sx={{ p: 4 }}>

          <Paper sx={{ p: 2.2, mb: 2, borderRadius: 3, background: "rgba(255,255,255,0.65)", border: "2px solid #1E3A8A" }}>
            <Typography variant="subtitle2" color="text.secondary">Mobile</Typography>
            {isEditing ? (
              <TextField fullWidth size="small" value={editedMobile} onChange={(e) => setEditedMobile(e.target.value)} />
            ) : (
              <Typography variant="h6">{profile.mobile || "N/A"}</Typography>
            )}
          </Paper>

          <Paper sx={{ p: 2.2, borderRadius: 3, background: "rgba(255,255,255,0.65)", border: "2px solid #1E3A8A" }}>
            <Typography variant="subtitle2" color="text.secondary">Active Plan</Typography>
            <Typography variant="h6">{plan?.name || profile.membership || "No Active Plan"}</Typography>
          </Paper>

          <Box sx={{ mt: 3, textAlign: "right" }}>
            {!isEditing ? (
              <Button variant="contained" endIcon={<EditIcon />} onClick={() => { setEditedMobile(profile.mobile); setIsEditing(true); }}>Edit</Button>
            ) : (
              <>
                <Button variant="contained" color="success" startIcon={<SaveIcon />} onClick={saveMobile} sx={{ mr: 2 }}>Save</Button>
                <Button variant="outlined" startIcon={<CancelIcon />} onClick={() => setIsEditing(false)}>Cancel</Button>
              </>
            )}
          </Box>

          {/* UPDATE PASSWORD */}
          <Box sx={{ mt: 4, textAlign: "center" }}>
            {!showPasswordForm ? (
              <Button variant="outlined" startIcon={<LockIcon />} onClick={() => setShowPasswordForm(true)}>
                Update Password
              </Button>
            ) : (
              <Box sx={{ maxWidth: 400, mx: "auto" }}>
                <TextField fullWidth size="small" label="Old Password" type="password" sx={{ my: 1 }} value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                <TextField fullWidth size="small" label="New Password" type="password" sx={{ mb: 2 }} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

                <Stack direction="row" justifyContent="center" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem("token");
                        await axios.put("http://localhost:8083/api/users/update-password", { oldPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });

                        setSnackbarMsg("Password updated successfully!");
                        setSnackbarOpen(true);
                        setShowPasswordForm(false);
                        setOldPassword("");
                        setNewPassword("");
                      } catch (err) {
                        setSnackbarMsg(err.response?.data?.message || "Failed to update password. Please check your old password.");
                        setSnackbarOpen(true);
                      }
                    }}
                  >
                    Save
                  </Button>

                  <Button variant="outlined" onClick={() => setShowPasswordForm(false)}>
                    Cancel
                  </Button>
                </Stack>
              </Box>
            )}
          </Box>

        </Box>
      )}

      {/* VEHICLE VIEW */}
      {view === "vehicle" && (
        <Box sx={{ textAlign: "center", p: 4 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {profile.vehicleName || "No Vehicle Assigned"}
          </Typography>

          {vehicle ? (
            <Box>
              <img
                src={vehicle.img}
                alt={profile.vehicleName}
                style={{
                  width: 220,
                  height: 220,
                  objectFit: "contain",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.1)",
                  marginBottom: 20,
                }}
              />
              <Typography variant="body1" color="text.secondary">
                Model Year: {profile.vehicleModelYear || "N/A"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reg. No: {profile.vehicleNumber || "N/A"}
              </Typography>
            </Box>
          ) : (
            <Typography color="error">Vehicle image not available</Typography>
          )}
        </Box>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3500}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMsg}
        action={<IconButton onClick={() => setSnackbarOpen(false)}><CloseIcon /></IconButton>}
      />

    </Paper>
  );
};

export default Profile;
