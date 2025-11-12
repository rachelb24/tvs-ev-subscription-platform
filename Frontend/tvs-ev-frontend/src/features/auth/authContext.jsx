// src/features/auth/authContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { logout as authLogout } from "./authService";
import { fetchProfile } from "../users/userService"; // only fetchProfile is needed now
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const initialToken = localStorage.getItem("token");
  const initialRole = localStorage.getItem("role");
  const [token, setTokenState] = useState(initialToken);
  const [role, setRoleState] = useState(initialRole);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  // Helper wrappers to keep localStorage in sync
  const setToken = (t) => {
    if (t) localStorage.setItem("token", t);
    else localStorage.removeItem("token");
    setTokenState(t);
  };
  const setRole = (r) => {
    if (r) localStorage.setItem("role", r);
    else localStorage.removeItem("role");
    setRoleState(r);
  };
  // Refresh profile (fetch profile which already contains plans)
  const refreshProfile = useCallback(async () => {
    try {
      const curToken = localStorage.getItem("token") || token;
      if (!curToken) {
        setUser(null);
        return null;
      }
      // fetchProfile returns UserResponse which already contains `plans`
      const profile = await fetchProfile();
      if (!profile) {
        setUser(null);
        return null;
      }
      // Use the plans included in profile (backend populates plans inside /profile)
      const composed = {
        ...profile,
        plans: profile.plans ?? [],
      };
      setUser(composed);
      return composed;
    } catch (err) {
      console.warn("refreshProfile error:", err);
      setUser(null);
      return null;
    }
  }, [token]);
  // Keep user state in sync when token changes (initial load)
  useEffect(() => {
    if (token) {
      // eager refresh profile
      refreshProfile();
    } else {
      setUser(null);
    }
  }, [token, refreshProfile]);
  const handleLogout = () => {
    try {
      authLogout();
    } catch (e) {
      console.warn("logout helper error:", e);
    }
    setToken(null);
    setRole(null);
    setUser(null);
    navigate("/login");
  };
  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        user,
        setToken,
        setRole,
        handleLogout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => useContext(AuthContext);