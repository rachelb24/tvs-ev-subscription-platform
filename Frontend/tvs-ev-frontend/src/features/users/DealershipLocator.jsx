// src/features/users/DealershipLocator.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  Paper,
  Stack,
  Card,
  CardContent,
  CircularProgress,
  Button,
  TextField,
} from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MyLocationIcon from "@mui/icons-material/MyLocation";

// ✅ Motorcycle icon for dealerships
const dealershipIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/252/252025.png",
  iconSize: [38, 38],
  iconAnchor: [19, 38],
});

// ✅ User icon
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// ✅ Smooth fly on dealer selection
const FlyToSelected = ({ selected }) => {
  const map = useMap();
  useEffect(() => {
    if (selected) {
      map.flyTo([selected.lat, selected.lng], 14, { duration: 1.3 });
    }
  }, [selected, map]);
  return null;
};

// ✅ Thick Blue Route Line
const RouteFromUser = ({ from, to }) => {
  const map = useMap();
  const controlRef = useRef(null);

  useEffect(() => {
    if (!from || !to) return;
    if (controlRef.current) map.removeControl(controlRef.current);

    controlRef.current = L.Routing.control({
      waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
      addWaypoints: false,
      show: false,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: "#0037FF", weight: 7, opacity: 0.9 }],
      },
      router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1" }),
      createMarker: () => null,
    }).addTo(map);

    return () => controlRef.current && map.removeControl(controlRef.current);
  }, [from, to, map]);

  return null;
};

// ✅ Distance Helpers
const toRad = (v) => (v * Math.PI) / 180;
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const fmtKm = (km) => (km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

export default function DealershipLocator() {
  const [dealerships, setDealerships] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [selected, setSelected] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [userPos, setUserPos] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Load dealerships from text file
  useEffect(() => {
    fetch("/dealerships.txt")
      .then((res) => res.text())
      .then((text) => {
        const rows = text
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line && line.includes("|"))
          .map((line) => {
            const [name, state, lat, lng, address] = line.split("|").map((s) => s.trim());
            return {
              name,
              state,
              lat: parseFloat(lat),
              lng: parseFloat(lng),
              address: address || "",
            };
          })
          .filter((d) => !isNaN(d.lat) && !isNaN(d.lng));

        setDealerships(rows);
      });
  }, []);

  // ✅ Get User Location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setUserPos({ lat: 12.9716, lng: 77.5946 }); //fallback - bangalore
        setLoading(false);
      }
    );
  }, []);

  // ✅ Add distance and sort nearest first
  const dealersWithDistance = useMemo(() => {
    if (!userPos) return dealerships;
    return dealerships
      .map((d) => ({
        ...d,
        distanceKm: getDistanceKm(userPos.lat, userPos.lng, d.lat, d.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userPos, dealerships]);

  // ✅ Apply search & state filters
  const filtered = dealersWithDistance.filter((d) => {
    const matchesState = !selectedState || selectedState === "All" || d.state === selectedState;
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.state.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesState && matchesSearch;
  });

  if (loading || !userPos)
    return <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={600} gutterBottom>🏍️ TVS Dealership Locator</Typography>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}
          displayEmpty sx={{ minWidth: 200, bgcolor: "white", borderRadius: 2 }}>
          <MenuItem value="">Select State</MenuItem>
          <MenuItem value="All">All States</MenuItem>
          {[...new Set(dealerships.map((d) => d.state))].map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </Select>

        <TextField placeholder="Search city / dealer / state"
          value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flex: 1, bgcolor: "white", borderRadius: 2 }} />

        <Button variant="outlined" startIcon={<MyLocationIcon />} onClick={() => setSelected(userPos)}>
          Locate Me
        </Button>
      </Box>

      <Paper elevation={3} sx={{ display: "flex", height: 520, borderRadius: 2, overflow: "hidden" }}>
        {/* Sidebar */}
        <Box sx={{ width: 320, borderRight: "1px solid #eee", overflowY: "auto", p: 2, bgcolor: "#fafafa" }}>
          <Stack spacing={2}>
            {filtered.map((d) => (
              <Card key={d.name} onClick={() => setSelected(d)}
                sx={{
                  cursor: "pointer",
                  border: selected?.name === d.name ? "2px solid #0037FF" : "1px solid transparent",
                  "&:hover": { backgroundColor: "#e8f1ff" },
                }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600}>{d.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    <LocationOnIcon fontSize="small" /> {d.state} • {fmtKm(d.distanceKm)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Map */}
        <Box sx={{ flex: 1 }}>
          <MapContainer center={userPos} zoom={6} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <FlyToSelected selected={selected} />
            <RouteFromUser from={userPos} to={selected} />

            {/* User */}
            <Marker position={[userPos.lat, userPos.lng]} icon={userIcon}>
              <Popup><b>Your Location</b></Popup>
            </Marker>

            {/* Dealerships */}
            {filtered.map((d) => (
              <Marker key={d.name} position={[d.lat, d.lng]} icon={dealershipIcon}
                eventHandlers={{ click: () => setSelected(d) }}>
                <Popup><b>{d.name}</b><br />{d.address}<br />📍 {fmtKm(d.distanceKm)} away</Popup>
              </Marker>
            ))}
          </MapContainer>
        </Box>
      </Paper>
    </Box>
  );
}
