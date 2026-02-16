import React, { useEffect, useState, useContext } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import { ThemeContext } from "../../../context/ThemeContext";
import API from "../../../api";
import EventCalendarView from "../../events/pages/EventCalendarView";
import "../AdminPanel.css";

// Helper function to convert 24-hour format to 12-hour AM/PM format
const formatTime12Hour = (time24) => {
  if (!time24) return "TBD";
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const location = useLocation();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

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
    organizerContact: "",
    organizerInfo: "",
    banner: null, // 👈 banner
  });

  const [bannerPreview, setBannerPreview] = useState(null);
  const [showReports, setShowReports] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [search, setSearch] = useState("");

  // Admin check
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/events");
    }
  }, [user, navigate]);

  // Open reports view when navigated with ?tab=reports
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("tab") === "reports") {
        setShowReports(true);
      } else {
        setShowReports(false);
      }
    } catch (e) {
      // ignore
    }
  }, [location.search]);

  // show calendar when ?tab=calendar
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      if (params.get("tab") === "calendar") {
        setShowCalendar(true);
      } else {
        setShowCalendar(false);
      }
    } catch (e) {
      // ignore
    }
  }, [location.search]);

  // ensure add form is not visible while viewing reports
  useEffect(() => {
    if (showReports) setShowForm(false);
  }, [showReports]);

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
        organizerContact: "",
        organizerInfo: "",
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

  // Calculate reports data
  const totalRegistrations = events.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0);
  const totalCapacity = events.reduce((sum, e) => sum + (e.maxRegistrations || 0), 0);
  const avgFillRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0;
  
  const today = new Date().toDateString();
  const eventsToday = events.filter(e => new Date(e.date).toDateString() === today).length;
  
  const upcomingEvents = events.filter(e => new Date(e.date) > new Date()).length;
  
  // Sort events by registrations for most popular
  const mostPopularEvents = [...events]
    .sort((a, b) => (b.currentRegistrations || 0) - (a.currentRegistrations || 0))
    .slice(0, 5);
  
  // Group events by department
  const eventsByDepartment = {};
  events.forEach(e => {
    const dept = e.department || "General";
    if (!eventsByDepartment[dept]) {
      eventsByDepartment[dept] = { count: 0, registrations: 0 };
    }
    eventsByDepartment[dept].count += 1;
    eventsByDepartment[dept].registrations += e.currentRegistrations || 0;
  });

  const reportsSection = (
    <>
      {showReports && !loading && (
        <div className="reports-view">
          <div className="reports-tabs">
            <button className="tab-btn active">📊 Reports & Insights</button>
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-label">Total Registrations</div>
                <div className="stat-value">{totalRegistrations.toLocaleString()}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-label">Average Fill Rate</div>
                <div className="stat-value">{avgFillRate}%</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-content">
                <div className="stat-label">Events Today</div>
                <div className="stat-value">{eventsToday}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-label">Upcoming Events</div>
                <div className="stat-value">{upcomingEvents}</div>
              </div>
            </div>
          </div>

          {/* Most Popular Events */}
          <div className="report-section">
            <h3>⭐ Most Popular Events</h3>
            {mostPopularEvents.length === 0 ? (
              <p>No events yet</p>
            ) : (
              <div className="popular-events-list">
                {mostPopularEvents.map((event, idx) => {
                  const regs = event.currentRegistrations || 0;
                  const max = event.maxRegistrations || 100;
                  const pct = Math.round((regs / Math.max(1, max)) * 100);
                  return (
                    <div key={event._id} className="popular-event-item">
                      <div className="popup-rank">{idx + 1}</div>
                      <div className="popup-info">
                        <div className="popup-title">{event.title}</div>
                        <div className="popup-dept">{event.department || "General"}</div>
                      </div>
                      <div className="popup-bar">
                        <div className="popup-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="popup-count">{regs}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Events by Department */}
          <div className="report-section">
            <h3>📊 Events by Department</h3>
            {Object.keys(eventsByDepartment).length === 0 ? (
              <p>No events yet</p>
            ) : (
              <div className="events-by-dept-list">
                {Object.entries(eventsByDepartment).map(([dept, data]) => (
                  <div key={dept} className="dept-item">
                    <div className="dept-info">
                      <div className="dept-name">{dept}</div>
                      <div className="dept-event-count">{data.count} {data.count === 1 ? 'event' : 'events'}</div>
                    </div>
                    <div className="dept-registrations">{data.registrations} registrations</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );

  const calendarSection = (
    <>
      <div className="calendar-wrapper">
        <EventCalendarView />
      </div>
    </>
  );

  const manageSection = (
    <>
      {!showReports && (
        <>
          <div className="admin-toolbar">
            <div className="toolbar-actions">
              <button className="btn-add-event" onClick={() => setShowForm(!showForm)}>
                {showForm ? "✕ Cancel" : "+ Add Event"}
              </button>
            </div>
          </div>

          <div className="admin-search">
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {showForm && (
            <div className="add-event-form">
              <h3>Create New Event</h3>
              <form className="event-form" onSubmit={handleAddEvent}>
                {/* Row 1: Title, Category */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      name="title"
                      value={newEvent.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <input
                      name="category"
                      value={newEvent.category}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Row 2: Description (full width) */}
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleInputChange}
                    rows="4"
                  />
                </div>

                {/* Row 3: Event Poster (Image/PDF) */}
                <div className="form-group">
                  <label>Event Poster (Image/PDF)</label>
                  <input type="file" accept="image/*,.pdf" onChange={handleBannerChange} />
                  {bannerPreview && (
                    <div className="banner-preview">
                      <img src={bannerPreview} alt="poster preview" />
                    </div>
                  )}
                </div>

                {/* Row 4: Date, Start Time, End Time */}
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

                {/* Row 5: Hall, Max Registrations */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Hall</label>
                    <select name="hall" value={newEvent.hall} onChange={handleInputChange}>
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
                      name="maxRegistrations"
                      type="number"
                      value={newEvent.maxRegistrations}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Row 6: Department, Organizer Name */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      name="department"
                      value={newEvent.department}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Organizer Name</label>
                    <input
                      name="organizerName"
                      value={newEvent.organizerName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Row 7: Organizer Contact, Organizer Info */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Organizer Contact</label>
                    <input
                      name="organizerContact"
                      value={newEvent.organizerContact}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Organizer Info</label>
                    <input
                      name="organizerInfo"
                      value={newEvent.organizerInfo}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Submit & Cancel buttons */}
                <div className="form-actions">
                  <button type="submit" className="btn-submit">Create Event</button>
                </div>
              </form>
            </div>
          )}

          <div className="events-section">
            <h3>Event List</h3>

            {loading ? (
              <p>⏳ Loading events...</p>
            ) : error ? (
              <p className="error-text">{error}</p>
            ) : events.length === 0 ? (
              <p>No events yet.</p>
            ) : (
              <div className="event-cards">
                {events
                  .filter((ev) => ev.title.toLowerCase().includes(search.toLowerCase()))
                  .map((event) => {
                    const current = event.currentRegistrations || 0;
                    const max = event.maxRegistrations || 100;
                    const pct = Math.round((current / Math.max(1, max)) * 100);
                    
                    // Color coding: Green <= 50%, Yellow 50-75%, Red > 75%
                    let barColor = "#10b981"; // Green (default)
                    if (pct > 75) {
                      barColor = "#ef4444"; // Red for full
                    } else if (pct > 50) {
                      barColor = "#eab308"; // Yellow for almost full
                    }

                    return (
                      <div key={event._id} className="event-card">
                        <div className="card-top">
                          <span className="status-pill">Upcoming</span>
                          <div className="card-actions">
                            <div className="three-dot-menu">
                              <button 
                                className="three-dot-btn" 
                                onClick={() => setActiveMenu(activeMenu === event._id ? null : event._id)}
                              >
                                ⋮
                              </button>
                              {activeMenu === event._id && (
                                <div className="dropdown-menu">
                                  <button className="menu-item edit-item">✏️ Edit Event</button>
                                  <button 
                                    className="menu-item delete-item"
                                    onClick={() => {
                                      handleDeleteEvent(event._id);
                                      setActiveMenu(null);
                                    }}
                                    disabled={deleting === event._id}
                                  >
                                    {deleting === event._id ? "Deleting..." : "🗑️ Delete Event"}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="card-content">
                          <h4 className="event-title">{event.title}</h4>
                          <p className="event-dept">{event.department || event.hall?.name || "General"}</p>

                          <div className="event-meta">
                            <p>📅 {new Date(event.date).toLocaleDateString()}</p>
                            <p>⏱ {formatTime12Hour(event.startTime)}</p>
                            <p>📍 {event.hall?.name || event.hall || "TBD"}</p>
                          </div>

                          <div className="registrations">
                            <div className="reg-label">Registrations</div>
                            <div className="reg-count">{current} / {max}</div>
                            <div className="reg-bar">
                              <div className="reg-fill" style={{ width: `${pct}%`, background: barColor }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              )}
              </div>
        </>
      )}
    </>
  );

  return (
    <div className={`admin-panel ${isDarkMode ? "dark-mode" : ""} ${showReports ? "reports-active" : ""} ${showCalendar ? "calendar-active" : ""}`}>
      {!(showReports || showCalendar) && (
        <div className="admin-header">
          <div>
            <h1>⚙️ Admin Panel - Event Management</h1>
          </div>
        </div>
      )}

      {message && (
        <div className={`admin-message ${message.includes("✓") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      {showReports ? reportsSection : showCalendar ? calendarSection : manageSection}
    </div>
  );
};

export default AdminPanel;
