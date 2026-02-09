// frontend/src/features/events/pages/EventDetails.js
import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../../api";
import { AuthContext } from "../../../context/AuthContext";
import "../components/EventFeedback.js";
import EventFeedback from "../components/EventFeedback";

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [event, setEvent] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch event details matching backend Event schema
  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }

    const fetchEvent = async () => {
      try {
        const res = await API.get(`/events/${eventId}`);
        setEvent(res.data);

        // Check if current user is registered for this event
        if (user?.role === "student") {
          try {
            const regRes = await API.get("/registrations/mine");
            const isReg = (regRes.data || []).some(
              (r) => r.event?._id === eventId || r.event?.eventId === eventId,
            );
            setIsRegistered(isReg);
          } catch (err) {
            console.log("Could not fetch registration status");
          }
        }
      } catch (err) {
        setMessage("Event not found");
        console.error("Error fetching event:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, user]);

  // Handle registration
  const handleRegister = async () => {
    setMessage("");

    if (!user) {
      setMessage("Please login to register for this event");
      return;
    }

    if (user.role !== "student") {
      setMessage("Only students can register for events");
      return;
    }

    try {
      setRegistering(true);
      await API.post(`/registrations`, { eventId });
      setMessage("✓ Registered successfully!");
      setIsRegistered(true);

      // Refresh event to show updated registration count
      const res = await API.get(`/events/${eventId}`);
      setEvent(res.data);
    } catch (err) {
      const errMsg = err.response?.data?.msg || "Registration failed";
      setMessage("❌ " + errMsg);
    } finally {
      setRegistering(false);
    }
  };

  // Handle unregistration
  const handleUnregister = async () => {
    if (!window.confirm("Are you sure you want to cancel registration?"))
      return;

    try {
      setRegistering(true);
      await API.delete(`/registrations/event/${eventId}`);
      setMessage("✓ Unregistered successfully!");
      setIsRegistered(false);

      // Refresh event to show updated registration count
      const res = await API.get(`/events/${eventId}`);
      setEvent(res.data);
    } catch (err) {
      const errMsg = err.response?.data?.msg || "Unregistration failed";
      setMessage("❌ " + errMsg);
    } finally {
      setRegistering(false);
    }
  };

  // Handle delete event (admin only)
  const handleDeleteEvent = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this event? This action cannot be undone.",
      )
    )
      return;

    try {
      setDeleting(true);
      await API.delete(`/events/${eventId}`);
      setMessage("✓ Event deleted successfully!");
      setTimeout(() => navigate("/events"), 1500);
    } catch (err) {
      const errMsg = err.response?.data?.msg || "Failed to delete event";
      setMessage("❌ " + errMsg);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="event-details">
        <p>⏳ Loading event details...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-details">
        <p>Event not found</p>
        <button onClick={() => navigate("/events")}>← Back to Events</button>
      </div>
    );
  }

  // Determine if event is full
  const isFull = event.currentRegistrations >= event.maxRegistrations;
  const isPast = new Date(event.date) < new Date();
  const isDisabled = event.status !== "active" || isPast;

  // Get hall details
  const hallName =
    typeof event.hall === "string" ? event.hall : event.hall?.name;
  const hallBuilding =
    typeof event.hall === "object" ? event.hall?.building : "";
  const hallFloor = typeof event.hall === "object" ? event.hall?.floor : "";

  return (
    <div className="event-details">
      <button className="back-btn" onClick={() => navigate("/events")}>
        ← Back
      </button>

      <div className="details-container">
        <div className="details-header">
          <h1>{event.title}</h1>
          <div className="badge-row">
            <span
              className="badge status"
              style={{
                backgroundColor:
                  event.status === "active"
                    ? "#10b981"
                    : event.status === "completed"
                      ? "#6b7280"
                      : "#ef4444",
              }}
            >
              {event.status.toUpperCase()}
            </span>
            {event.category && (
              <span className="badge category">{event.category}</span>
            )}
            {event.featured && (
              <span className="badge featured">⭐ FEATURED</span>
            )}
            {isFull && <span className="badge full">FULL</span>}
          </div>
        </div>

        <div className="details-grid">
          {/* Left Column */}
          <div className="details-left">
            <section>
              <h3>📖 About Event</h3>
              <p>{event.description}</p>
            </section>

            <section>
              <h3>📅 Event Schedule</h3>
              <ul>
                <li>
                  <strong>Date:</strong>{" "}
                  {new Date(event.date).toLocaleDateString()}
                </li>
                <li>
                  <strong>Start Time:</strong> {event.startTime}
                </li>
                <li>
                  <strong>End Time:</strong> {event.endTime}
                </li>
              </ul>
            </section>

            <section>
              <h3>📍 Location</h3>
              <ul>
                <li>
                  <strong>Hall:</strong> {hallName || "TBD"}
                </li>
                {hallBuilding && (
                  <li>
                    <strong>Building:</strong> {hallBuilding}
                  </li>
                )}
                {hallFloor && (
                  <li>
                    <strong>Floor:</strong> {hallFloor}
                  </li>
                )}
              </ul>
            </section>

            <section>
              <h3>👤 Organizer</h3>
              <ul>
                <li>
                  <strong>Name:</strong> {event.organizerName}
                </li>
                <li>
                  <strong>Contact:</strong> {event.organizerContact}
                </li>
              </ul>
            </section>

            <section>
              <h3>🏢 Department</h3>
              <p>{event.department}</p>
            </section>
          </div>

          {/* Right Column - Registration Card */}
          <div className="details-right">
            <div className="registration-card">
              <h2>Registration</h2>

              {/* Admin Delete Button */}
              {user?.role === "admin" && (
                <button
                  className="btn-delete-admin"
                  onClick={handleDeleteEvent}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "🗑️ Delete Event"}
                </button>
              )}

              {/* Capacity Info */}
              <div className="capacity-info">
                <div className="capacity-bar">
                  <div
                    className="capacity-fill"
                    style={{
                      width: `${(event.currentRegistrations / event.maxRegistrations) * 100}%`,
                      backgroundColor: isFull ? "#ef4444" : "#10b981",
                    }}
                  />
                </div>
                <p>
                  <strong>
                    {event.currentRegistrations} / {event.maxRegistrations}
                  </strong>{" "}
                  registered
                  {isFull && (
                    <span className="capacity-full"> (Event is full)</span>
                  )}
                </p>
              </div>

              {/* Registration Buttons */}
              {isDisabled ? (
                <div className="disabled-message">
                  {event.status !== "active" && (
                    <p>This event is {event.status}</p>
                  )}
                  {isPast && <p>This event has already occurred</p>}
                </div>
              ) : isFull ? (
                <button className="btn-full" disabled>
                  Event is Full
                </button>
              ) : isRegistered ? (
                <div>
                  <button
                    className="btn-unregister"
                    onClick={handleUnregister}
                    disabled={registering}
                  >
                    {registering ? "Processing..." : "Cancel Registration"}
                  </button>
                </div>
              ) : user?.role === "student" ? (
                <button
                  className="btn-register"
                  onClick={handleRegister}
                  disabled={registering}
                >
                  {registering ? "Registering..." : "Register Now"}
                </button>
              ) : (
                <p className="login-prompt">Login as student to register</p>
              )}

              {/* Message */}
              {message && (
                <div
                  className={`message ${message.includes("❌") ? "error" : "success"}`}
                >
                  {message}
                </div>
              )}
            </div>

            {/* Hall Capacity */}
            {event.hall && typeof event.hall === "object" && (
              <div className="hall-info">
                <h3>🏛️ Hall Info</h3>
                <p>
                  <strong>Capacity:</strong> {event.hall.capacity}
                </p>
                {event.hall.facilities && event.hall.facilities.length > 0 && (
                  <div>
                    <strong>Facilities:</strong>
                    <ul>
                      {event.hall.facilities.map((f, i) => (
                        <li key={i}>✓ {f}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Feedback Section */}
            <EventFeedback eventId={eventId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
