import React, { useEffect, useRef, useState } from "react";
import Globe from "react-globe.gl";
import { Box, Typography, List, ListItemButton, Paper } from "@mui/material";

const locations = [
  { country: "India", lat: 20.5937, lng: 78.9629 },
  { country: "Indonesia", lat: -0.7893, lng: 113.9213 },
  { country: "Philippines", lat: 12.8797, lng: 121.774 },
  { country: "Thailand", lat: 15.87, lng: 100.9925 },
  { country: "Vietnam", lat: 14.0583, lng: 108.2772 },
  { country: "Bangladesh", lat: 23.685, lng: 90.3563 },
  { country: "Sri Lanka", lat: 7.8731, lng: 80.7718 },
  { country: "Nepal", lat: 28.3949, lng: 84.124 },
  { country: "UAE", lat: 23.4241, lng: 53.8478 },
  { country: "Turkey", lat: 38.9637, lng: 35.2433 },
  { country: "Nigeria", lat: 9.082, lng: 8.6753 },
  { country: "Kenya", lat: -0.0236, lng: 37.9062 },
  { country: "Uganda", lat: 1.3733, lng: 32.2903 },
  { country: "South Africa", lat: -30.5595, lng: 22.9375 },
  { country: "Colombia", lat: 4.5709, lng: -74.2973 },
  { country: "Mexico", lat: 23.6345, lng: -102.5528 },
  { country: "Peru", lat: -9.19, lng: -75.0152 },
  { country: "Chile", lat: -35.6751, lng: -71.543 },
  { country: "Bolivia", lat: -16.2902, lng: -63.5887 },
  { country: "Argentina", lat: -38.4161, lng: -63.6167 }
];

const dealerCount = {
  India: 520,
  Indonesia: 75,
  Philippines: 42,
  Thailand: 38,
  Vietnam: 60,
  Bangladesh: 25,
  "Sri Lanka": 18,
  Nepal: 20,
  UAE: 30,
  Turkey: 12,
  Nigeria: 40,
  Kenya: 22,
  Uganda: 15,
  "South Africa": 33,
  Colombia: 19,
  Mexico: 27,
  Peru: 10,
  Chile: 13,
  Bolivia: 8,
  Argentina: 21
};

const GlobalPresence = () => {
  const globeRef = useRef();
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    globe.controls().enableRotate = true;
    globe.controls().enableZoom = false;
    globe.controls().enablePan = false;
  }, []);

  const flyToLocation = (loc) => {
    setSelectedLocation(loc);
    globeRef.current.pointOfView({ lat: loc.lat, lng: loc.lng, altitude: 1.5 }, 1500);
  };

  return (
    <Box sx={{ display: "flex", width: "100vw", height: "100vh", background: "black" }}>
      
      {/* Sidebar */}
      <Box sx={{
        width: "300px",
        background: "rgba(255,255,255,0.08)",
        borderRight: "1px solid rgba(255,255,255,0.2)",
        p: 2,
        backdropFilter: "blur(6px)",
        display: "flex",
        flexDirection: "column",
        color: "white"
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>TVS Global Presence 🌍</Typography>

        <List sx={{ overflowY: "auto", flex: 1 }}>
          {locations.map((loc) => (
            <ListItemButton
              key={loc.country}
              onClick={() => flyToLocation(loc)}
              sx={{
                borderRadius: "6px",
                mb: 0.5,
                color: "white",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.15)" }
              }}
            >
              {loc.country}
            </ListItemButton>
          ))}
        </List>
      </Box>

      {/* Globe */}
      <Box sx={{ flex: 1, position: "relative" }}>
        <Globe
          ref={globeRef}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
          pointsData={locations}
          pointAltitude={0.03}
          pointColor={() => "#E31837"}
          pointLabel={(d) => `Location: ${d.country}`}
          onPointClick={(d) => flyToLocation(d)}
        />

        {/* 📍 Floating Info Card */}
        {selectedLocation && (
          <Paper
            sx={{
              position: "absolute",
              top: 30,
              left: 30,
              p: 2,
              borderRadius: "10px",
              background: "rgba(255,255,255,0.85)",
              backdropFilter: "blur(6px)",
              minWidth: 200
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ color: "#001B44" }}>
              {selectedLocation.country}
            </Typography>
            <Typography variant="body1" sx={{ color: "#333" }}>
              Dealers: <b>{dealerCount[selectedLocation.country] ?? "N/A"}</b>
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default GlobalPresence;
