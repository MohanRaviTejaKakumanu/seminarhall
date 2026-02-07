import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../api";
import "./MyEvents.css";

const MyEvents = () => {
  const { user } = useContext(AuthContext);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("upcoming");

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const res = await API.get("/registrations/mine");
      setRegistrations(res.data);
    } catch (err) {
      console.error("Error fetching registrations:", err);
    } finally {
      setLoading(false);
    }
  };

  const filterRegistrations = () => {
    const now = new Date();
    if (filter === "upcoming") {
      return registrations.filter(r => new Date(r.event.date) >= now);
    } else if (filter === "past") {
      return registrations.filter(r => new Date(r.event.date) < now);
    }
    return registrations;
  };

  const handleUnregister = async (registrationId) => {
    if (window.confirm("Are you sure you want to unregister from this event?")) {
      try {
        await API.delete(`/registrations/${registrationId}`);
        setRegistrations(registrations.filter(r => r._id !== registrationId));
        alert("Unregistered successfully!");
      } catch (err) {
        alert("Error unregistering: " + err.response?.data?.msg);
      }
    }
  };

  const filtered = filterRegistrations();

  return (
    <div className="my-events-container">
      <div className="my-events-header">
        <h1>✨ My Events</h1>
        <p>Manage your registered events</p>
        <p className="user-greeting">Welcome, <strong>{user?.name}</strong>!</p>
      </div>

      <div className="events-filter">
        <button
          className={`filter-btn ${filter === "upcoming" ? "active" : ""}`}
          onClick={() => setFilter("upcoming")}
        >
          📅 Upcoming ({registrations.filter(r => new Date(r.event.date) >= new Date()).length})
        </button>
        <button
          className={`filter-btn ${filter === "past" ? "active" : ""}`}
          onClick={() => setFilter("past")}
        >
          ✓ Attended ({registrations.filter(r => new Date(r.event.date) < new Date()).length})
        </button>
        <button
          className={`filter-btn ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          📋 All ({registrations.length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading your events...</div>
      ) : filtered.length === 0 ? (
        <div className="no-events-message">
          <p>🎉 {filter === "upcoming" ? "No upcoming events. Explore and register!" : "No past events yet."}</p>
        </div>
      ) : (
        <div className="my-events-grid">
          {filtered.map((registration) => (
            <div key={registration._id} className="my-event-card">
              <div className="event-card-img">
                <div className="event-badge">{registration.event.category}</div>
              </div>
              <div className="event-card-body">
                <h3>{registration.event.title}</h3>
                <p className="event-organizer">👤 {registration.event.organizerName || "Event Team"}</p>
                
                <div className="event-info-grid">
                  <div className="info-item">
                    <span className="label">📅 Date</span>
                    <span className="value">{new Date(registration.event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">🕐 Time</span>
                    <span className="value">{registration.event.startTime} - {registration.event.endTime}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">📍 Location</span>
                    <span className="value">{registration.event.hall?.name || "TBD"}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">👥 Attendees</span>
                    <span className="value">{registration.event.currentRegistrations || 0}/{registration.event.maxRegistrations}</span>
                  </div>
                </div>

                <p className="event-description">{registration.event.description}</p>

                <div className="event-actions">
                  {new Date(registration.event.date) >= new Date() ? (
                    <>
                      <button 
                        className="btn btn-primary"
                        onClick={() => {
                          const url = `https://maps.google.com/?q=${registration.event.hall?.name}`;
                          window.open(url, "_blank");
                        }}
                      >
                        📍 Get Directions
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleUnregister(registration._id)}
                      >
                        ✕ Unregister
                      </button>
                    </>
                  ) : (
                    <div className="event-status completed">✓ Event Completed</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyEvents;