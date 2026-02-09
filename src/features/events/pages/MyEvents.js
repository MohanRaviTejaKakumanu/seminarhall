import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import API from "../../../api";
import "../MyEvents.css";

const MyEvents = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");
  const [error, setError] = useState(null);

  // Fetch user registrations from backend
  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      // Fetch user's registrations - backend returns Registration objects with event populated
      const res = await API.get("/registrations/mine");
      setRegistrations(res.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching registrations:", err);
      setError("Failed to load your registrations");
    } finally {
      setLoading(false);
    }
  };

  // Filter registrations based on event date
  const filterRegistrations = () => {
    const now = new Date();

    if (filter === "upcoming") {
      return registrations.filter((r) => {
        if (!r.event) return false;
        return new Date(r.event.date) >= now;
      });
    } else if (filter === "past") {
      return registrations.filter((r) => {
        if (!r.event) return false;
        return new Date(r.event.date) < now;
      });
    }
    return registrations;
  };

  // Handle unregistration
  const handleUnregister = async (registrationId) => {
    if (
      !window.confirm(
        "Are you sure you want to cancel registration from this event?",
      )
    ) {
      return;
    }

    try {
      await API.delete(`/registrations/${registrationId}`);
      setRegistrations(registrations.filter((r) => r._id !== registrationId));
      alert("✓ Unregistered successfully!");
    } catch (err) {
      const errMsg = err.response?.data?.msg || "Failed to unregister";
      alert("❌ Error: " + errMsg);
    }
  };

  // Get hall name from hall object or fallback
  const getHallName = (hall) => {
    if (!hall) return "TBD";
    return typeof hall === "string" ? hall : hall.name;
  };

  // Get hall building from hall object
  const getHallBuilding = (hall) => {
    if (!hall || typeof hall === "string") return "";
    return hall.building || "";
  };

  // Known hall coordinates (use when opening directions)
  const HALL_COORDS = {
    "newton hall": { lat: 16.24785544, lng: 80.43105981 },
    "cv raman hall": { lat: 16.24782066, lng: 80.43110418 },
    "abdul kalam hall": { lat: 16.24808629, lng: 80.43100546 },
  };

  const findHallCoords = (hallName) => {
    if (!hallName) return null;
    const key = hallName.toLowerCase();
    // direct match
    if (HALL_COORDS[key]) return HALL_COORDS[key];
    // partial match
    for (const k of Object.keys(HALL_COORDS)) {
      if (key.includes(k)) return HALL_COORDS[k];
    }
    return null;
  };

  const filtered = filterRegistrations();
  const upcomingCount = registrations.filter(
    (r) => r.event && new Date(r.event.date) >= new Date(),
  ).length;
  const pastCount = registrations.filter(
    (r) => r.event && new Date(r.event.date) < new Date(),
  ).length;

  return (
    <div className="my-events-container">
      <div className="my-events-header">
        <h1>✨ My Events</h1>
        <p>Manage your registered events</p>
        <p className="user-greeting">
          Welcome, <strong>{user?.name || "Student"}!</strong>
        </p>
      </div>

      {/* Filter Tabs */}
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
          ✓ Attended ({pastCount})
        </button>
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          📋 All ({registrations.length})
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="loading">⏳ Loading your events...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div className="no-events-message">
          <p>
            🎉{" "}
            {filter === "upcoming"
              ? "No upcoming events. Explore and register for more!"
              : filter === "past"
                ? "No past events yet."
                : "You haven't registered for any events yet."}
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
                {/* Event Header with Badges */}
                <div className="event-card-img">
                  <div
                    className="event-badge"
                    style={{
                      backgroundColor: isPast ? "#6b7280" : "#10b981",
                    }}
                  >
                    {isPast ? "COMPLETED" : event.status.toUpperCase()}
                  </div>
                  {event.category && (
                    <div className="category-badge">{event.category}</div>
                  )}
                </div>

                {/* Event Details */}
                <div className="event-card-body">
                  <h3>{event.title}</h3>
                  <p className="event-organizer">
                    👤 {event.organizerName || "Event Team"}
                  </p>

                  {/* Event Info Grid */}
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
                        {event.startTime} - {event.endTime}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">📍 Location</span>
                      <span className="value">{getHallName(event.hall)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">👥 Attendees</span>
                      <span className="value">
                        {event.currentRegistrations || 0}/
                        {event.maxRegistrations}
                      </span>
                    </div>
                  </div>

                  {/* Event Description */}
                  <p className="event-description">{event.description}</p>

                  {/* Department */}
                  {event.department && (
                    <p className="event-department">
                      <strong>🏢 Department:</strong> {event.department}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="event-actions">
                    {!isPast ? (
                      <>
                        {/* Get Directions Button */}
                        <button
                          className="btn btn-primary"
                          onClick={() => {
                            const hallName = getHallName(event.hall);
                            const coords = findHallCoords(hallName);
                            if (coords) {
                              const url = `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
                              window.open(url, "_blank");
                              return;
                            }

                            // Fallback: search by name/building
                            const hallBuilding = getHallBuilding(event.hall);
                            const query = hallBuilding
                              ? `${hallName} ${hallBuilding}`
                              : hallName;
                            const url = `https://maps.google.com/?q=${encodeURIComponent(query)}`;
                            window.open(url, "_blank");
                          }}
                        >
                          📍 Get Directions
                        </button>

                        {/* Unregister Button */}
                        <button
                          className="btn btn-danger"
                          onClick={() => handleUnregister(registration._id)}
                        >
                          ✕ Cancel Registration
                        </button>

                        {/* Event Details Button */}
                        <button
                          className="btn btn-secondary"
                          onClick={() =>
                            navigate(`/event/${event._id || event.eventId}`)
                          }
                        >
                          📋 Details
                        </button>
                      </>
                    ) : (
                      /* Completed Event Status */
                      <div className="event-status completed">
                        <p>✓ Event Completed</p>
                        <button
                          className="btn btn-secondary"
                          onClick={() =>
                            navigate(`/event/${event._id || event.eventId}`)
                          }
                        >
                          📋 View Details
                        </button>
                      </div>
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
