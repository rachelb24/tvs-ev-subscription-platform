import api from "../../services/api";
/**
 * Fetch the logged-in user's profile
 * GET /api/users/profile
 */
export const fetchProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await api.get("/api/users/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(":x: Error fetching profile:", error);
    throw error.response?.data || new Error("Failed to fetch profile");
  }
};
/**
 * Update user profile details
 * PUT /api/users/profile
 *
 * Backend expects field `vehicleNo` in the request (DTO UserProfileRequest).
 * Frontend often holds `vehicleNumber` in profile (response). This function
 * maps vehicleNumber -> vehicleNo automatically if needed.
 */
export const updateProfile = async (updatedData) => {
  try {
    const token = localStorage.getItem("token");
    // prepare payload for backend: convert naming and types
    const payload = {
      fullName: updatedData.fullName,
      email: updatedData.email,
      mobile: updatedData.mobile,
      vehicleName: updatedData.vehicleName ?? null,
      vehicleModelYear:
        updatedData.vehicleModelYear !== undefined && updatedData.vehicleModelYear !== null
          ? Number(updatedData.vehicleModelYear)
          : null,
      // backend expects vehicleNo; frontend may provide vehicleNo or vehicleNumber
      vehicleNo:
        updatedData.vehicleNo?.trim?.() ||
        updatedData.vehicleNumber?.trim?.() ||
        null,
    };
    const response = await api.put("/api/users/profile", payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(":x: Error updating profile:", error);
    // normalize thrown error
    const err = error.response?.data || error;
    throw err;
  }
};
/* other functions unchanged (fetchUserPlans, fetchAllUsers, deleteUser) */
export const fetchUserPlans = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await api.get("/api/users/plans", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(":x: Error fetching user plans:", error);
    throw error.response?.data || new Error("Failed to fetch user plans");
  }
};
export const fetchAllUsers = async () => {
  try {
    const token = localStorage.getItem("token");
    const response = await api.get("/api/admin/users", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(":x: Error fetching all users:", error);
    throw error.response?.data || new Error("Failed to fetch users");
  }
};
export const deleteUser = async (userId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await api.delete(`/api/admin/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(":x: Error deleting user:", error);
    throw error.response?.data || new Error("Failed to delete user");
  }
};