import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import API from "../api";
import "./AdminPanel.css";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    hall: "",
    category: "",
    maxRegistrations: "",
    department: "",
    organizerName: "",
  });
  const [halls, setHalls] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState("");

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/events");
    }
  }, [user, navigate]);

  // Fetch events and halls
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [eventsRes, hallsRes] = await Promise.all([
          API.get("/events"),
          API.get("/halls"),
        ]);
        setEvents(eventsRes.data || []);
        setHalls(hallsRes.data || []);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle new event form change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle add event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    setMessage("");

    if (
      !newEvent.title ||
      !newEvent.date ||
      !newEvent.startTime ||
      !newEvent.endTime
    ) {
      setMessage("❌ Please fill in all required fields");
      return;
    }

    try {
      const eventData = {
        ...newEvent,
        maxRegistrations: parseInt(newEvent.maxRegistrations) || 100,
        status: "active",
        approved: true,
        currentRegistrations: 0,
      };

      const res = await API.post("/events", eventData);
      setEvents([...events, res.data]);
      setNewEvent({
        title: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        hall: "",
        category: "",
        maxRegistrations: "",
        department: "",
        organizerName: "",
      });
      setShowForm(false);
      setMessage("✓ Event created successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.msg || "Failed to create event";
      setMessage("❌ " + errMsg);
    }
  };

  // Handle delete event
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;

    try {
      setDeleting(eventId);
      await API.delete(`/events/${eventId}`);
      setEvents(events.filter((e) => e._id !== eventId));
      setMessage("✓ Event deleted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.msg || "Failed to delete event";
      setMessage("❌ " + errMsg);
    } finally {
      setDeleting(null);
    }
  };

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <div className="admin-panel">
      {/* Header */}
      <div className="admin-header">
        <h1>🎛️ Admin Panel - Event Management</h1>
        <p className="subtitle">Manage all events</p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`admin-message ${message.includes("✓") ? "success" : "error"}`}
        >
          {message}
        </div>
      )}

      {/* Add Event Button */}
      <div className="admin-toolbar">
        <button
          className="btn-add-event"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "✕ Cancel" : "+ Add New Event"}
        </button>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <div className="add-event-form">
          <h3>Create New Event</h3>
          <form onSubmit={handleAddEvent}>
            <div className="form-row">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={newEvent.title}
                  onChange={handleInputChange}
                  placeholder="Event title"
                  required
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  value={newEvent.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Workshop, Seminar"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={newEvent.description}
                onChange={handleInputChange}
                placeholder="Event description"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={newEvent.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Start Time *</label>
                <input
                  type="time"
                  name="startTime"
                  value={newEvent.startTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>End Time *</label>
                <input
                  type="time"
                  name="endTime"
                  value={newEvent.endTime}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hall</label>
                <select
                  name="hall"
                  value={newEvent.hall}
                  onChange={handleInputChange}
                >
                  <option value="">Select a hall</option>
                  {halls.map((h) => (
                    <option key={h._id} value={h._id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Max Registrations</label>
                <input
                  type="number"
                  name="maxRegistrations"
                  value={newEvent.maxRegistrations}
                  onChange={handleInputChange}
                  placeholder="100"
                  min="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <input
                  type="text"
                  name="department"
                  value={newEvent.department}
                  onChange={handleInputChange}
                  placeholder="e.g., CSE, ECE"
                />
              </div>
              <div className="form-group">
                <label>Organizer Name</label>
                <input
                  type="text"
                  name="organizerName"
                  value={newEvent.organizerName}
                  onChange={handleInputChange}
                  placeholder="Event organizer"
                />
              </div>
            </div>

            <button type="submit" className="btn-submit">
              ✓ Create Event
            </button>
          </form>
        </div>
      )}

      {/* Events Table */}
      <div className="events-section">
        <h3>All Events</h3>
        {loading ? (
          <p>⏳ Loading events...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : events.length === 0 ? (
          <p>No events yet. Create your first event!</p>
        ) : (
          <div className="events-table">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Hall</th>
                  <th>Category</th>
                  <th>Registrations</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event._id || event.eventId}>
                    <td>{event.title}</td>
                    <td>{new Date(event.date).toLocaleDateString()}</td>
                    <td>
                      {event.startTime} - {event.endTime}
                    </td>
                    <td>
                      {typeof event.hall === "string"
                        ? event.hall
                        : event.hall?.name || "TBD"}
                    </td>
                    <td>{event.category || "-"}</td>
                    <td>
                      {event.currentRegistrations}/{event.maxRegistrations}
                    </td>
                    <td>
                      <span className={`status-badge ${event.status}`}>
                        {event.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() =>
                          handleDeleteEvent(event._id || event.eventId)
                        }
                        disabled={deleting === (event._id || event.eventId)}
                      >
                        {deleting === (event._id || event.eventId)
                          ? "Deleting..."
                          : "🗑️ Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
