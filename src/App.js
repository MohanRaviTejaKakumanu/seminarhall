// src/App.js
import React, { useContext, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import { AuthContext } from "./context/AuthContext";
import { ThemeContext } from "./context/ThemeContext";

// Shared Components
import Navbar from "./shared/components/Navbar";
import Footer from "./shared/components/Footer";

// Auth Features
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";

// Events Features
import StudentPanel from "./features/studentpanel/studentpanel";
import EventsPage from "./features/events/pages/EventsPage";

// Maps Features
import MapView from "./features/maps/pages/MapView";
import HallEventsOnMap from "./features/maps/components/HallEventsOnMap";

// Notifications Features
import Notifications from "./features/notifications/pages/Notifications";

// Admin Features
import AdminPanel from "./features/admin/pages/AdminPanel";

function Layout() {
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const location = useLocation();

  // Apply dark mode to body
  useEffect(() => {
    if (isDarkMode) {
      document.body.style.background = "#1a1a1a";
      document.body.style.color = "#e5e7eb";
    } else {
      document.body.style.background = "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)";
      document.body.style.color = "#333";
    }
  }, [isDarkMode]);

  // 🔥 Auth pages
  const authPages = ["/login", "/register", "/forgot-password"];
  const hideNavbar = authPages.includes(location.pathname);

  // Redirect to login if not authenticated (except on auth pages)
  if (!user && !authPages.includes(location.pathname)) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className={isDarkMode ? "dark-mode" : ""}>
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
          element={
            user
              ? user.role === "student"
                ? <StudentPanel />
                : <Navigate to="/admin" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/my-events"
          element={
            user
              ? user.role === "student"
                ? <EventsPage />
                : <Navigate to="/admin" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/map"
          element={
            user
              ? user.role === "student"
                ? <MapView />
                : <Navigate to="/admin" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/hall-events"
          element={
            user
              ? user.role === "student"
                ? <HallEventsOnMap />
                : <Navigate to="/admin" replace />
              : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/notifications"
          element={
            user
              ? (user.role === "student" || user.role === "admin")
                ? <Notifications />
                : <Navigate to="/events" replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* Admin Panel */}
        <Route
          path="/admin"
          element={
            user?.role === "admin" ? <AdminPanel /> : <Navigate to={user ? "/events" : "/login"} replace />
          }
        />

        {/* Default - Redirect to /events if logged in, or /login if not */}
        <Route
          path="/"
          element={<Navigate to={user ? "/events" : "/login"} replace />}
        />

        {/* Catch-all for undefined routes */}
        <Route
          path="*"
          element={<Navigate to={user ? "/events" : "/login"} replace />}
        />
      </Routes>

      {/* ✅ Footer on all pages */}
      {user && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
