import React from "react";
import { Box, Typography, Link, Stack } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#253C80",
        color: "white",
        py: 3,
        px: 2,
        textAlign: "center",
        mt: "auto",
      }}
    >
      {/* TVS Logo with white patch */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
        <Box
          sx={{
            backgroundColor: "white",
            borderRadius: "8px",
            px: 1.5,
            py: 0.5,
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          <img
            src="https://www.tvsmotor.com/-/media/Feature/Header/TVSLogo-hr.svg"
            alt="TVS Motor Logo"
            style={{ height: "32px" }}
          />
        </Box>
      </Box>

      <Typography variant="body2" sx={{ mb: 1 }}>
        Powering Progress. Inspiring Mobility.™
      </Typography>

      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        sx={{ mb: 1, flexWrap: "wrap" }}
      >
        <Link
          href="https://www.tvsmotor.com/about-us"
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{ color: "white", fontSize: "0.9rem" }}
        >
          About Us
        </Link>
        <Link
          href="https://www.tvsmotor.com/contact-us"
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{ color: "white", fontSize: "0.9rem" }}
        >
          Contact
        </Link>
        <Link
          href="https://www.tvsmotor.com/careers"
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{ color: "white", fontSize: "0.9rem" }}
        >
          Careers
        </Link>
      </Stack>

      <Typography variant="caption" sx={{ opacity: 0.8 }}>
        © {new Date().getFullYear()} TVS Motor Company. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
