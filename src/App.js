// src/App.js
import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AuthContext } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import LoginPage from "./components/LoginPage";
import RegisterPage from "./components/RegisterPage";
import ForgotPasswordPage from "./components/ForgotPasswordPage";
import EventList from "./components/EventList";
import EventDetails from "./components/EventDetails";
import MyEvents from "./components/MyEvents";
import EventCalendarView from "./components/EventCalendarView";
import MapView from "./components/MapView";
import HallEventsOnMap from "./components/HallEventsOnMap";

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
        <Route path="/events" element={user ? <EventList /> : <Navigate to="/login" />} />
        <Route path="/events/:id" element={user ? <EventDetails /> : <Navigate to="/login" />} />
        <Route path="/my-events" element={user ? <MyEvents /> : <Navigate to="/login" />} />
        <Route path="/calendar" element={user ? <EventCalendarView /> : <Navigate to="/login" />} />
        <Route path="/map" element={user ? <MapView /> : <Navigate to="/login" />} />
        <Route path="/hall-events" element={user ? <HallEventsOnMap /> : <Navigate to="/login" />} />

        {/* Default */}
        <Route path="*" element={<Navigate to={user ? "/events" : "/login"} />} />
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
