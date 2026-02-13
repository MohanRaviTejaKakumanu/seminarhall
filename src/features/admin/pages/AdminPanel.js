import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import API from "../../../api";
import "../AdminPanel.css";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(null);

  const [halls, setHalls] = useState([]);

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
    banner: null, // 👈 banner
  });

  const [bannerPreview, setBannerPreview] = useState(null);

  // Admin check
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/events");
    }
  }, [user, navigate]);

  // Fetch events + halls
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
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  // Banner change
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setNewEvent((prev) => ({ ...prev, banner: file }));
    setBannerPreview(URL.createObjectURL(file));
  };

  // Add event
  const handleAddEvent = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!newEvent.title || !newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      setMessage("❌ Please fill all required fields");
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

      const formData = new FormData();
      Object.keys(eventData).forEach((key) => {
        if (key !== "banner") {
          formData.append(key, eventData[key]);
        }
      });

      if (newEvent.banner) {
        formData.append("banner", newEvent.banner);
      }

      const res = await API.post("/events", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setEvents([...events, res.data]);
      setMessage("✓ Event created successfully!");

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
        banner: null,
      });
      setBannerPreview(null);
      setShowForm(false);

      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      const errMsg = err.response?.data?.msg || "Failed to create event";
      setMessage("❌ " + errMsg);
    }
  };

  // Delete event
  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Delete this event?")) return;

    try {
      setDeleting(id);
      await API.delete(`/events/${id}`);
      setEvents(events.filter((e) => e._id !== id));
      setMessage("✓ Event deleted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage("❌ Failed to delete event");
    } finally {
      setDeleting(null);
    }
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin-panel">
      {/* Header */}
      <div className="admin-header">
        <h1>🎛️ Admin Panel - Event Management</h1>
        <p className="subtitle">Manage all events</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`admin-message ${message.includes("✓") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-toolbar">
        <button className="btn-add-event" onClick={() => setShowForm(!showForm)}>
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
                <input name="title" value={newEvent.title} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Category</label>
                <input name="category" value={newEvent.category} onChange={handleInputChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={newEvent.description}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            {/* Banner */}
            <div className="form-group">
              <label>Event Banner</label>
              <input type="file" accept="image/*" onChange={handleBannerChange} />
              {bannerPreview && (
                <img src={bannerPreview} alt="Banner Preview" className="banner-preview" />
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date *</label>
                <input type="date" name="date" value={newEvent.date} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>Start Time *</label>
                <input type="time" name="startTime" value={newEvent.startTime} onChange={handleInputChange} required />
              </div>

              <div className="form-group">
                <label>End Time *</label>
                <input type="time" name="endTime" value={newEvent.endTime} onChange={handleInputChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hall</label>
                <select name="hall" value={newEvent.hall} onChange={handleInputChange}>
                  <option value="">Select a hall</option>
                  {halls.map((h) => (
                    <option key={h._id} value={h._id}>{h.name}</option>
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
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <input name="department" value={newEvent.department} onChange={handleInputChange} />
              </div>

              <div className="form-group">
                <label>Organizer Name</label>
                <input name="organizerName" value={newEvent.organizerName} onChange={handleInputChange} />
              </div>
            </div>

            <button type="submit" className="btn-submit">✓ Create Event</button>
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
          <p>No events yet.</p>
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
                  <tr key={event._id}>
                    <td>{event.title}</td>
                    <td>{new Date(event.date).toLocaleDateString()}</td>
                    <td>{event.startTime} - {event.endTime}</td>
                    <td>{event.hall?.name || event.hall || "TBD"}</td>
                    <td>{event.category || "-"}</td>
                    <td>{event.currentRegistrations}/{event.maxRegistrations}</td>
                    <td>
                      <span className={`status-badge ${event.status}`}>{event.status}</span>
                    </td>
                    <td>
                      <button
                        className="btn-delete"
                        onClick={() => handleDeleteEvent(event._id)}
                        disabled={deleting === event._id}
                      >
                        {deleting === event._id ? "Deleting..." : "🗑️ Delete"}
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
