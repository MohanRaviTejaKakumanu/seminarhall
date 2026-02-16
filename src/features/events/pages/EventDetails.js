// frontend/src/features/events/pages/EventDetails.js
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api";
import { AuthContext } from "../../../context/AuthContext";
import { ThemeContext } from "../../../context/ThemeContext";
import EventFeedback from "../components/EventFeedback";
import "./EventDetails.css"; // ✅ CORRECT PATH

// Helper function to convert 24-hour format to 12-hour AM/PM format
const formatTime12Hour = (time24) => {
  if (!time24) return "TBD";
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);

  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch event details
  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        const res = await API.get(`/events/${eventId}`);
        setEvent(res.data);

        // Check registration status (student only)
        if (user?.role === "student") {
          const regRes = await API.get("/registrations/mine");
          const registered = (regRes.data || []).some(
            (r) =>
              r.event?._id === eventId ||
              r.event?.eventId === eventId
          );
          setIsRegistered(registered);
        }
      } catch (err) {
        console.error(err);
        setMessage("❌ Event not found");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, user]);

  // Register
  const handleRegister = async () => {
    if (!user) {
      setMessage("Please login to register");
      return;
    }

    try {
      setRegistering(true);
      await API.post("/registrations", { eventId });
      setIsRegistered(true);
      setMessage("✓ Registered successfully");

      const res = await API.get(`/events/${eventId}`);
      setEvent(res.data);
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.msg || "Registration failed"));
    } finally {
      setRegistering(false);
    }
  };

  // Unregister
  const handleUnregister = async () => {
    if (!window.confirm("Cancel registration?")) return;

    try {
      setRegistering(true);
      await API.delete(`/registrations/event/${eventId}`);
      setIsRegistered(false);
      setMessage("✓ Unregistered successfully");

      const res = await API.get(`/events/${eventId}`);
      setEvent(res.data);
    } catch (err) {
      setMessage("❌ " + (err.response?.data?.msg || "Failed"));
    } finally {
      setRegistering(false);
    }
  };

  // Delete event (admin)
  const handleDeleteEvent = async () => {
    if (!window.confirm("Delete this event permanently?")) return;

    try {
      setDeleting(true);
      await API.delete(`/events/${eventId}`);
      setMessage("✓ Event deleted");
      setTimeout(() => navigate("/events"), 1500);
    } catch (err) {
      setMessage("❌ Delete failed");
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="event-details">⏳ Loading...</div>;
  }

  if (!event) {
    return (
      <div className="event-details">
        <p>Event not found</p>
        <button onClick={() => navigate("/events")}>← Back</button>
      </div>
    );
  }

  const isFull = event.currentRegistrations >= event.maxRegistrations;
  const isPast = new Date(event.date) < new Date();
  const isDisabled = isPast || event.status !== "active";

  const hallName =
    typeof event.hall === "string" ? event.hall : event.hall?.name;

  // Helper to get poster image
  const getEventPoster = () => {
    if (event?.banner) {
      return event.banner.startsWith("http")
        ? event.banner
        : `${process.env.REACT_APP_API_URL}/${event.banner}`;
    }
    return "/default-event-banner.jpg";
  };

  return (
    <div className={`event-details ${isDarkMode ? "dark-mode" : ""}`}>
      <button className="back-btn" onClick={() => navigate("/events")}>
        ← Back
      </button>

      <div className="details-container">
        {/* Hero Section with Poster */}
        <div className="event-hero">
          <img
            src={getEventPoster()}
            alt={event.title}
            className="event-hero-img"
          />
          <div className="hero-overlay">
            <h1>{event.title}</h1>
            {event.category && (
              <span className="hero-category">{event.category}</span>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="details-header">
          <div className="badge-row">
            <span className={`badge status ${event.status}`}>
              {event.status.toUpperCase()}
            </span>

            {event.category && (
              <span className="badge category">{event.category}</span>
            )}

            {isFull && <span className="badge full">FULL</span>}
          </div>
        </div>

        <div className="details-grid">
          {/* LEFT */}
          <div className="details-left">
            <section>
              <h3>📖 About</h3>
              <p>{event.description}</p>
            </section>

            <section>
              <h3>📅 Schedule</h3>
              <p>Date: {new Date(event.date).toLocaleDateString()}</p>
              <p>
                Time: {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}
              </p>
            </section>

            <section>
              <h3>📍 Location</h3>
              <p>{hallName || "TBD"}</p>
            </section>

            <section>
              <h3>👤 Organizer</h3>
              <p><strong>{event.organizerName}</strong></p>
              {event.organizerContact && (
                <p>Contact: {event.organizerContact}</p>
              )}
              {event.organizerInfo && (
                <p>{event.organizerInfo}</p>
              )}
            </section>

            <section>
              <h3>🏢 Department</h3>
              <p>{event.department}</p>
            </section>
          </div>

          {/* RIGHT */}
          <div className="details-right">
            <div className="registration-card">
              <h2>Registration</h2>

              {user?.role === "admin" && (
                <button
                  className="btn-delete-admin"
                  onClick={handleDeleteEvent}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "🗑️ Delete Event"}
                </button>
              )}

              <p>
                {event.currentRegistrations}/{event.maxRegistrations} registered
              </p>

              {isDisabled ? (
                <p className="disabled-message">Registration closed</p>
              ) : isRegistered ? (
                <button
                  className="btn-unregister"
                  onClick={handleUnregister}
                  disabled={registering}
                >
                  Cancel Registration
                </button>
              ) : (
                <button
                  className="btn-register"
                  onClick={handleRegister}
                  disabled={registering}
                >
                  Register Now
                </button>
              )}

              {message && (
                <div
                  className={`message ${
                    message.includes("❌") ? "error" : "success"
                  }`}
                >
                  {message}
                </div>
              )}
            </div>

            {/* Feedback */}
            <EventFeedback eventId={eventId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
