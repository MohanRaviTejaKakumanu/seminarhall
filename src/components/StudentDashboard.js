import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../api";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    totalRegistrations: 0,
    hallCount: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const eventsRes = await API.get("/events");
        const allEvents = eventsRes.data || [];

        const activeCount = allEvents.filter(
          (e) => e.status === "active"
        ).length;

        const hallsRes = await API.get("/halls");
        const hallCount = (hallsRes.data || []).length;

        let registrationCount = 0;
        if (user?.role === "student") {
          try {
            const regRes = await API.get("/registrations/mine");
            registrationCount = (regRes.data || []).length;
          } catch {
            console.warn("Registrations fetch skipped");
          }
        }

        setStats({
          totalEvents: allEvents.length,
          activeEvents: activeCount,
          totalRegistrations: registrationCount,
          hallCount,
          loading: false,
          error: null,
        });
      } catch (err) {
        console.error(err);
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load dashboard stats",
        }));
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>📊 Student Dashboard</h1>
        <p className="subtitle">
          Welcome back, <span>{user?.name || "Student"}</span> 👋
        </p>
      </div>

      {/* Loading */}
      {stats.loading && (
        <div className="loading-cards">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      )}

      {/* Stats Cards */}
      {!stats.loading && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalEvents}</div>
            <div className="stat-label">Total Events</div>
            <div className="stat-description">All available events</div>
          </div>

          <div className="stat-card active">
            <div className="stat-number">{stats.activeEvents}</div>
            <div className="stat-label">Active Events</div>
            <div className="stat-description">Open for registration</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">{stats.totalRegistrations}</div>
            <div className="stat-label">My Registrations</div>
            <div className="stat-description">Events you joined</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">{stats.hallCount}</div>
            <div className="stat-label">Seminar Halls</div>
            <div className="stat-description">Available venues</div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>🚀 Quick Actions</h2>

        <div className="grid">
          <div className="action-card" onClick={() => navigate("/events")}>
            <span className="icon">🎉</span>
            <span className="title">All Events</span>
            <span className="desc">Browse & register</span>
          </div>

          <div className="action-card" onClick={() => navigate("/myevents")}>
            <span className="icon">✨</span>
            <span className="title">My Events</span>
            <span className="desc">Your registrations</span>
          </div>

          <div className="action-card" onClick={() => navigate("/calendar")}>
            <span className="icon">📅</span>
            <span className="title">Calendar</span>
            <span className="desc">View schedule</span>
          </div>

          <div className="action-card" onClick={() => navigate("/map")}>
            <span className="icon">📍</span>
            <span className="title">Campus Map</span>
            <span className="desc">Find locations</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {stats.error && (
        <div className="error-banner">
          ⚠️ {stats.error}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
