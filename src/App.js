// src/App.js
import React, { useContext } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AuthContext } from "./context/AuthContext";

// Shared Components
import Navbar from "./shared/components/Navbar";

// Auth Features
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";

// Events Features
import EventList from "./features/events/pages/EventList";
import EventDetails from "./features/events/pages/EventDetails";
import MyEvents from "./features/events/pages/MyEvents";
import EventCalendarView from "./features/events/pages/EventCalendarView";

// Maps Features
import MapView from "./features/maps/pages/MapView";
import HallEventsOnMap from "./features/maps/components/HallEventsOnMap";

// Notifications Features
import Notifications from "./features/notifications/pages/Notifications";

// Admin Features
import AdminPanel from "./features/admin/pages/AdminPanel";

function Layout() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // 🔥 Auth pages
  const authPages = ["/login", "/register", "/forgot-password"];
  const hideNavbar = authPages.includes(location.pathname);

  return (
    <>
      {/* ✅ Navbar ONLY after login */}
      {user && !hideNavbar && <Navbar />}

      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Student Dashboard pages */}
        <Route
          path="/events"
          element={user ? <EventList /> : <Navigate to="/login" />}
        />
        <Route
          path="/event/:eventId"
          element={user ? <EventDetails /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-events"
          element={user ? <MyEvents /> : <Navigate to="/login" />}
        />
        <Route
          path="/calendar"
          element={user ? <EventCalendarView /> : <Navigate to="/login" />}
        />
        <Route
          path="/map"
          element={user ? <MapView /> : <Navigate to="/login" />}
        />
        <Route
          path="/hall-events"
          element={user ? <HallEventsOnMap /> : <Navigate to="/login" />}
        />
        <Route
          path="/notifications"
          element={user ? <Notifications /> : <Navigate to="/login" />}
        />

        {/* Admin Panel */}
        <Route
          path="/admin"
          element={
            user?.role === "admin" ? <AdminPanel /> : <Navigate to="/events" />
          }
        />

        {/* Default */}
        <Route
          path="*"
          element={<Navigate to={user ? "/events" : "/login"} />}
        />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
