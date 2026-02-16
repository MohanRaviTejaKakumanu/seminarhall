import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { ThemeContext } from "../../../context/ThemeContext";
import API from "../../../api";
import "../MyEvents.css";

// Helper function to convert 24-hour format to 12-hour AM/PM format
const formatTime12Hour = (time24) => {
  if (!time24) return "TBD";
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const MyEvents = () => {
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [error, setError] = useState(null);

  // Fetch registrations
  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const res = await API.get("/registrations/mine");
      setRegistrations(res.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load your registrations");
    } finally {
      setLoading(false);
    }
  };

  // Banner helper (ADMIN PANEL banner support)
  const getEventBanner = (event) => {
    if (event?.banner) {
      return event.banner.startsWith("http")
        ? event.banner
        : `${process.env.REACT_APP_API_URL}/${event.banner}`;
    }
    return "/default-event-banner.jpg"; // fallback
  };

  // Filters
  const filterRegistrations = () => {
    const now = new Date();

    if (filter === "upcoming") {
      return registrations.filter(
        (r) => r.event && new Date(r.event.date) >= now
      );
    }

    if (filter === "past") {
      return registrations.filter(
        (r) => r.event && new Date(r.event.date) < now
      );
    }

    return registrations;
  };

  const handleUnregister = async (registrationId) => {
    if (!window.confirm("Cancel registration for this event?")) return;

    try {
      await API.delete(`/registrations/${registrationId}`);
      setRegistrations(registrations.filter((r) => r._id !== registrationId));
      alert("✓ Unregistered successfully!");
    } catch (err) {
      alert("❌ Failed to unregister");
    }
  };

  const getHallName = (hall) => {
    if (!hall) return "TBD";
    return typeof hall === "string" ? hall : hall.name;
  };

  const filtered = filterRegistrations();
  const upcomingCount = registrations.filter(
    (r) => r.event && new Date(r.event.date) >= new Date()
  ).length;

  const pastCount = registrations.filter(
    (r) => r.event && new Date(r.event.date) < new Date()
  ).length;

  return (
    <div className={`my-events-container ${isDarkMode ? "dark-mode" : ""}`}>
      {/* Header */}
      <div className="my-events-header">
        <h1>✨ My Events</h1>
        <p>Manage your registered events</p>
        <p className="user-greeting">
          Welcome, <strong>{user?.name || "Student"}!</strong>
        </p>
      </div>

      {/* Filters */}
      <div className="events-filter">
        <button
          className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
          onClick={() => setFilter("upcoming")}
        >
          📅 Upcoming ({upcomingCount})
        </button>
        <button
          className={`filter-btn ${filter === "past" ? "active" : ""}`}
          onClick={() => setFilter("past")}
        >
          ✓ Registered ({pastCount})
        </button>
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          📋 All ({registrations.length})
        </button>
      </div>

      {/* States */}
      {loading ? (
        <div className="loading">⏳ Loading your events...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="no-events-message">
          <p>
            🎉{" "}
            {filter === "upcoming"
              ? "No upcoming events. Explore and register!"
              : filter === "past"
              ? "No registered events yet."
              : "You have not registered for any events."}
          </p>
          <button className="explore-btn" onClick={() => navigate("/events")}>
            Explore Events →
          </button>
        </div>
      ) : (
        /* Events Grid */
        <div className="my-events-grid">
          {filtered.map((registration) => {
            const event = registration.event;
            const isPast = new Date(event.date) < new Date();

            return (
              <div key={registration._id} className="my-event-card">
                {/* Banner */}
                <div className="event-card-img">
                  <img
                    src={getEventBanner(event)}
                    alt={event.title}
                    className="event-banner"
                  />

                  <div
                    className="event-badge"
                    style={{
                      backgroundColor: isPast ? "#6b7280" : "#10b981",
                    }}
                  >
                    {isPast ? "REGISTERED" : event.status.toUpperCase()}
                  </div>

                  {event.category && (
                    <div className="category-badge">{event.category}</div>
                  )}
                </div>

                {/* Body */}
                <div className="event-card-body">
                  <h3>{event.title}</h3>
                  <p className="event-organizer">
                    👤 {event.organizerName || "Event Team"}
                  </p>

                  <div className="event-info-grid">
                    <div className="info-item">
                      <span className="label">📅 Date</span>
                      <span className="value">
                        {new Date(event.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">🕐 Time</span>
                      <span className="value">
                        {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">📍 Location</span>
                      <span className="value">
                        {getHallName(event.hall)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">👥 Attendees</span>
                      <span className="value">
                        {event.currentRegistrations || 0}/
                        {event.maxRegistrations}
                      </span>
                    </div>
                  </div>

                  <p className="event-description">{event.description}</p>

                  {event.department && (
                    <p className="event-department">
                      <strong>🏢 Department:</strong> {event.department}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="event-actions">
                    {!isPast ? (
                      <>
                        <button
                          className="btn btn-primary"
                          onClick={() =>
                            navigate(`/event/${event._id || event.eventId}`)
                          }
                        >
                          📋 Details
                        </button>

                        <button
                          className="btn btn-danger"
                          onClick={() =>
                            handleUnregister(registration._id)
                          }
                        >
                          ✕ Cancel Registration
                        </button>
                      </>
                    ) : (
                      <button
                        className="btn btn-secondary"
                        onClick={() =>
                          navigate(`/event/${event._id || event.eventId}`)
                        }
                      >
                        📋 View Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyEvents;
