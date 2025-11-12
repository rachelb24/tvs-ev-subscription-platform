// src/components/layout/Navbar.jsx
import React, { useMemo } from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../features/auth/authContext";

const Navbar = () => {
  const { token, role, handleLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdmin = useMemo(() => {
    try {
      return role?.toLowerCase() === "admin";
    } catch {
      return false;
    }
  }, [role]);

  const whiteButton = {
    color: "#253C80",
    backgroundColor: "#FFFFFF",
    border: "1px solid white",
    textTransform: "none",
    ml: 2,
    "&:hover": { backgroundColor: "#f2f2f2" },
  };

  return (
    <AppBar
      position="static"
      sx={{ backgroundColor: "#253C80", boxShadow: "none", py: 1 }}
    >
      <Toolbar sx={{ justifyContent: "space-between" }}>
        {/* Logo */}
        <Box
          sx={{ display: "flex", alignItems: "center", cursor: "pointer" }}
          onClick={() => navigate("/")}
        >
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: "8px",
              px: 1.5,
              py: 0.5,
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src="https://www.tvsmotor.com/-/media/Feature/Header/TVSLogo-hr.svg"
              alt="TVS Logo"
              style={{ height: "35px" }}
            />
          </Box>
        </Box>

        <Box display="flex" alignItems="center">
        <Button sx={whiteButton} onClick={() => navigate("/global-presence")}>
  Global Presence
</Button>

          {/* ✅ Show Dealership Locator ALWAYS */}
          <Button sx={whiteButton} onClick={() => navigate("/dealerships")}>
            Dealership Locator
          </Button>

          {token ? (
            <>
              <Button
                sx={whiteButton}
                onClick={() => navigate(isAdmin ? "/admin" : "/dashboard")}
              >
                Dashboard
              </Button>
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#E31837",
                  textTransform: "none",
                  ml: 2,
                  "&:hover": { backgroundColor: "#b8361f" },
                }}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              {/* ✅ Login matches Register style now */}
              <Button sx={whiteButton} onClick={() => navigate("/login")}>
                Login
              </Button>

              <Button sx={whiteButton} onClick={() => navigate("/register")}>
                Register
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
