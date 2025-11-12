import api from "../../services/api";
/**
 * login (unchanged but standardized error handling)
 */
export const login = async (email, password) => {
  try {
    const res = await api.post("/api/users/login", { email, password });
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("role", res.data.role);
    return res.data;
  } catch (err) {
    console.error("Login error:", err.response?.data || err.message);
    const message =
      err?.response?.data?.message ||
      (typeof err?.response?.data === "string" ? err.response.data : null) ||
      err?.message ||
      "Login failed. Please try again.";
    throw new Error(message);
  }
};
/**
 * register - now includes vehicleNo and strong error extraction
 */
export const register = async (userData) => {
  try {
    const payload = {
      fullName: userData.fullName,
      email: userData.email,
      mobile: userData.mobile,
      password: userData.password,
      vehicleName: userData.vehicleName || null,
      vehicleModelYear: userData.vehicleModelYear
        ? Number(userData.vehicleModelYear)
        : null,
      // backend expects vehicleNo (trim and uppercase for consistency)
      vehicleNo: userData.vehicleNo
        ? String(userData.vehicleNo).trim().toUpperCase()
        : null,
    };
    const res = await api.post("/api/users/register", payload);
    return res.data;
  } catch (err) {
    console.error("Register error:", err.response?.data || err.message);
    let message = "Registration failed. Check inputs and try again.";
    const data = err?.response?.data;
    if (data) {
      if (typeof data === "string") {
        message = data;
      } else if (data.message) {
        message = data.message;
      } else if (data.error) {
        message = data.error;
      } else if (data.errors) {
        const e = data.errors;
        if (typeof e === "string") message = e;
        else if (Array.isArray(e)) message = e.join(". ");
        else if (typeof e === "object") message = Object.values(e)
          .flat()
          .join(". ");
      }
    } else if (err.message) {
      message = err.message;
    }
    throw new Error(message);
  }
};
/**
 * logout - clears session
 */
export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
};