// src/pages/MapPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Stack,
  CircularProgress,
} from "@mui/material";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useParams, useLocation, useNavigate } from "react-router-dom";

// -----------------------
// Hardcoded Locations
// -----------------------
const LOCATIONS = [
  { name: "Parking Shed, Near FM Office, IQL", lat: 12.7321, lng: 77.8274, type: "Office", availablePorts: 5, availableBatteries: 8 },
  { name: "QAD Charging Area, TVSM 2W Plant, Hosur", lat: 12.7379, lng: 77.8323, type: "Office", availablePorts: 4, availableBatteries: 6 },
  { name: "Basement Parking, TVSM Pratik Tech Park, E-City", lat: 12.8411, lng: 77.6649, type: "Office", availablePorts: 3, availableBatteries: 5 },
  { name: "Basement Parking, TVSM Focus Tower, E-City", lat: 12.8495, lng: 77.6663, type: "Office", availablePorts: 2, availableBatteries: 7 },
  { name: "TVS Hosur Main Dealership", lat: 12.737, lng: 77.832, type: "Dealership", availablePorts: 6, availableBatteries: 9 },
  { name: "TVS Bommanahalli Showroom", lat: 12.906, lng: 77.625, type: "Dealership", availablePorts: 3, availableBatteries: 5 },
  { name: "TVS Koramangala Service Center", lat: 12.935, lng: 77.62, type: "Dealership", availablePorts: 2, availableBatteries: 4 },
  { name: "TVS HSR Layout Dealership", lat: 12.91, lng: 77.64, type: "Dealership", availablePorts: 5, availableBatteries: 8 },
  { name: "TVS Electronic City Phase 2", lat: 12.83, lng: 77.68, type: "Dealership", availablePorts: 7, availableBatteries: 9 },
  { name: "TVS Whitefield", lat: 12.972, lng: 77.751, type: "Dealership", availablePorts: 4, availableBatteries: 5 },
  { name: "TVS Hebbal Showroom", lat: 13.035, lng: 77.6, type: "Dealership", availablePorts: 2, availableBatteries: 6 },
  { name: "TVS Jayanagar", lat: 12.93, lng: 77.58, type: "Dealership", availablePorts: 6, availableBatteries: 10 },
  { name: "TVS Indiranagar", lat: 12.97, lng: 77.64, type: "Dealership", availablePorts: 3, availableBatteries: 7 },
  { name: "TVS Rajajinagar", lat: 12.99, lng: 77.56, type: "Dealership", availablePorts: 2, availableBatteries: 3 },
  { name: "TVS Marathahalli", lat: 12.96, lng: 77.71, type: "Dealership", availablePorts: 5, availableBatteries: 8 },
];

// -----------------------
// Helpers
// -----------------------
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

// -----------------------
// Marker icons (UPDATED ✅)
// -----------------------
const officeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/1483/1483336.png", // Building icon for OFFICES ✅
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const dealershipIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png", // Red map pin for DEALERSHIPS ✅
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// -----------------------
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 13, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
};

const FlyToSelected = ({ selected }) => {
  const map = useMap();
  useEffect(() => {
    if (selected) map.flyTo([selected.lat, selected.lng], 15, { duration: 1.2 });
  }, [selected, map]);
  return null;
};

// -----------------------
// Thick Blue Route (UPDATED ✅)
// -----------------------
const RouteFromUser = ({ from, to }) => {
  const map = useMap();
  const controlRef = useRef(null);

  useEffect(() => {
    if (!from || !to) return;

    if (controlRef.current) map.removeControl(controlRef.current);

    controlRef.current = L.Routing.control({
      waypoints: [L.latLng(from.lat, from.lng), L.latLng(to.lat, to.lng)],
      lineOptions: {
        styles: [{ color: "#0037FF", weight: 7, opacity: 0.9 }], // THICK DARK BLUE ✅
      },
      addWaypoints: false,
      show: false,
      fitSelectedRoutes: true,
      router: L.Routing.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1" }),
      createMarker: () => null,
    }).addTo(map);

    return () => {
      if (controlRef.current) map.removeControl(controlRef.current);
    };
  }, [from, to, map]);

  return null;
};

// -----------------------
// Main Component (UNCHANGED LOGIC ✅)
// -----------------------
export default function MapPage() {
  const { featureId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [subscriptionId] = useState(location.state?.subscriptionId || null);
  const [featureName] = useState(location.state?.featureName || decodeURIComponent(featureId || ""));
  const [booking, setBooking] = useState(false);
  const [selected, setSelected] = useState(null);
  const [userPos, setUserPos] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleConfirmBooking = async () => {
    if (!token) return alert("You must be logged in to book this feature.");
    if (!subscriptionId || !featureName) return alert("Missing required data.");
    if (!selected) return alert("Please select a location before booking.");

    setBooking(true);
    try {
      const resp = await fetch("http://localhost:8083/api/plan-usage/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscriptionId, featureName, location: selected.name }),
      });

      const text = await resp.text();
      if (!resp.ok) return alert(text || "Booking failed.");

      alert(JSON.parse(text)?.message || "Booking successful!");
      navigate("/dashboard/planusage");
    } catch (err) {
      console.error(err);
      alert("Booking failed.");
    } finally {
      setBooking(false);
    }
  };

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLoading(false);
      },
      () => {
        setUserPos({ lat: 12.9716, lng: 77.5946 });
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  const locationsWithDistance = useMemo(() => {
    if (!userPos) return LOCATIONS;
    return LOCATIONS.map((loc) => ({
      ...loc,
      distanceKm: getDistanceKm(userPos.lat, userPos.lng, loc.lat, loc.lng),
    })).sort((a, b) => a.distanceKm - b.distanceKm);
  }, [userPos]);

  const nearestDealership = locationsWithDistance.find((l) => l.type === "Dealership");

  if (loading || !userPos)
    return <Box sx={{ p: 5, display: "flex", justifyContent: "center" }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>

      <Typography variant="h5" gutterBottom fontWeight="600">
        Select Location for Feature: {featureName}
      </Typography>

      {nearestDealership && (
        <Typography sx={{ mb: 2, color: "text.secondary" }}>
          Nearest dealership: <b>{nearestDealership.name}</b> ({fmtKm(nearestDealership.distanceKm)})
        </Typography>
      )}

      <Paper elevation={3} sx={{ height: 520, display: "flex", overflow: "hidden" }}>
        
        {/* Sidebar */}
        <Box sx={{ width: 360, borderRight: "1px solid #eee", overflowY: "auto", p: 2, bgcolor: "#fafafa" }}>
          <Stack spacing={2}>
            {locationsWithDistance.map((loc, idx) => (
              <Card key={idx} onClick={() => setSelected(loc)}
                variant={selected?.name === loc.name ? "outlined" : "elevation"}
                sx={{
                  cursor: "pointer",
                  borderColor: selected?.name === loc.name ? "green" : "transparent",
                  "&:hover": { backgroundColor: "#f1f8e9" }
                }}
              >
                <CardContent>
                  <Typography fontWeight={600}>{loc.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    <LocationOnIcon fontSize="small" /> {loc.type} • {fmtKm(loc.distanceKm)}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Map */}
        <Box sx={{ flex: 1 }}>
          <MapContainer center={userPos} zoom={12} style={{ height: "100%", width: "100%" }}>
            
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

            <RecenterMap lat={userPos.lat} lng={userPos.lng} />
            <FlyToSelected selected={selected} />
            <RouteFromUser from={userPos} to={selected} />

            <Marker position={userPos} icon={userIcon}>
              <Popup><b>Your Location</b></Popup>
            </Marker>

            {locationsWithDistance.map((loc, i) => (
              <Marker key={i}
                position={[loc.lat, loc.lng]}
                icon={loc.type === "Office" ? officeIcon : dealershipIcon}
                eventHandlers={{ click: () => setSelected(loc) }}
              >
                <Popup>
                  <b>{loc.name}</b>
                  <br />{loc.type}<br />
                  ⚡ Ports: {loc.availablePorts} | 🔋 Batteries: {loc.availableBatteries}
                  <br />{fmtKm(loc.distanceKm)} away
                </Popup>
              </Marker>
            ))}

          </MapContainer>
        </Box>
      </Paper>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
        <Button variant="outlined" onClick={() => navigate(-1)}>Cancel</Button>
        <Button variant="contained" color="success" disabled={booking} onClick={handleConfirmBooking}>
          {booking ? "Booking..." : "Confirm Booking"}
        </Button>
      </Box>

    </Box>
  );
}
