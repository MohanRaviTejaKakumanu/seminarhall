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

const getEventBanner = (event) => {
  if (event?.banner) {
    return event.banner.startsWith("http")
      ? event.banner
      : `${process.env.REACT_APP_API_URL}/${event.banner}`;
  }
  return "/default-event-banner.jpg";
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
const [showManageEvents, setShowManageEvents] = useState(false);
const [editingEvent, setEditingEvent] = useState(null);
const [activeTab, setActiveTab] = useState('active');

// Set default tab to 'studentFeedback' when Reports section is opened
useEffect(() => {
  if (showReports) {
    setActiveTab('studentFeedback');
  }
}, [showReports]);
const [openMenu, setOpenMenu] = useState(null);

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

  // Handle manage-events tab (default view with events list and form)
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const tab = params.get("tab");
      if (tab === "manage-events" || !tab) {
        setShowReports(false);
        setShowCalendar(false);
      }
    } catch (e) {
      // ignore
    }
  }, [location.search]);
// show manage-events when ?tab=manage-events
useEffect(() => {
  try {
    const params = new URLSearchParams(location.search);
    if (params.get("tab") === "manage-events") {
      setShowManageEvents(true);
    } else {
      setShowManageEvents(false);
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

  // Admin authorization check
  if (!user || user.role !== "admin") return null;

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

      let res;
      if (editingEvent) {
        res = await API.put(`/events/${editingEvent._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setEvents(events.map(e => e._id === editingEvent._id ? res.data : e));
        setMessage("✓ Event updated successfully!");
      } else {
        res = await API.post("/events", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setEvents([...events, res.data]);
        setMessage("✓ Event created successfully!");
      }
      setEditingEvent(null);

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

  // Filter events for manage events view
  const upcomingEventsFiltered = events.filter(e => new Date(e.date) > new Date());
  const activeEventsFiltered = events.filter(e => new Date(e.date).toDateString() === today);
  const completedEventsFiltered = events.filter(e => new Date(e.date) < new Date());

  return (
    <>
      <div className={`admin-bg-stable${isDarkMode ? ' dark-mode' : ''}`} />
      <div className={`admin-panel ${isDarkMode ? "dark-mode" : ""}`}>
        {showReports ? (
          <div>
            <div className="admin-header">
              <h1>Reports</h1>
              <button className="back-btn" onClick={() => navigate('')} >Back to Dashboard</button>
            </div>
            {/* Reports Tabs */}
            <div className="reports-tabs" style={{ display: 'flex', gap: '2rem', margin: '2rem 0 1.5rem 0' }}>
              <button
                className={`tab-btn ${activeTab === 'studentFeedback' ? 'active' : ''}`}
                onClick={() => setActiveTab('studentFeedback')}
                style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', border: 'none', background: activeTab === 'studentFeedback' ? '#3975f6' : '#f5f6fa', color: activeTab === 'studentFeedback' ? '#fff' : '#222', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: activeTab === 'studentFeedback' ? '0 2px 8px #3975f633' : 'none', transition: 'all 0.2s' }}
              >
                Student Feedback
              </button>
              <button
                className={`tab-btn ${activeTab === 'byDepartment' ? 'active' : ''}`}
                onClick={() => setActiveTab('byDepartment')}
                style={{ padding: '0.7rem 1.5rem', borderRadius: '10px', border: 'none', background: activeTab === 'byDepartment' ? '#3975f6' : '#f5f6fa', color: activeTab === 'byDepartment' ? '#fff' : '#222', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: activeTab === 'byDepartment' ? '0 2px 8px #3975f633' : 'none', transition: 'all 0.2s' }}
              >
                Events by Department
              </button>
            </div>
            <div className="reports-content">
              {activeTab === 'studentFeedback' && (
                <div className="popular-events-list">
                  {/* Student feedback content goes here */}
                </div>
              )}
              {activeTab === 'byDepartment' && (
                <div>
                  <h2>Events by Department</h2>
                  <p>Events by department data will be shown here.</p>
                </div>
              )}
            </div>
          </div>
        ) : showCalendar ? (
          <EventCalendarView />
        ) : showManageEvents ? (
          <div>
            <div className="admin-header">
              <h1>Manage Events</h1>
              <button className="back-btn" onClick={() => navigate('')} >Back to Dashboard</button>
            </div>
            {message && (
              <div className={`admin-message ${message.includes("✓") ? "success" : "error"}`}>
                {message}
              </div>
            )}
            <div className="manage-events-container">
              <div className="events-tabs">
                <button 
                  className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('active')}
                >
                  Active
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('upcoming')}
                >
                  Upcoming
                </button>
                <button 
                  className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('completed')}
                >
                  Completed
                </button>
              </div>
              <div className="events-content">
                {activeTab === 'active' && (
                  <div className="events-card active">
                    <h3>Active</h3>
                    {loading ? (
                      <p>⏳ Loading...</p>
                    ) : error ? (
                      <p className="error-text">{error}</p>
                    ) : activeEventsFiltered.length === 0 ? (
                      <p>No active events.</p>
                    ) : (
                      <table className="events-table">
                        <thead>
                          <tr>
                            <th>Event Name</th>
                            <th>Date & Time</th>
                            <th>Registrations</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeEventsFiltered.map((event) => {
                            const startTime = formatTime12Hour(event.startTime);
                            const percentage = event.maxRegistrations > 0 ? (event.currentRegistrations / event.maxRegistrations) * 100 : 0;
                            const color = percentage <= 50 ? '#10b981' : percentage <= 75 ? '#f59e0b' : '#ef4444';
                            return (
                              <tr key={event._id}>
                                <td>
                                  <div className="event-name-col">
                                    <strong>{event.title}</strong>
                                    {event.description && <p>{event.description}</p>}
                                  </div>
                                </td>
                                <td>{new Date(event.date).toLocaleDateString()} at {startTime}</td>
                                <td>
                                  <div className="registration-bar">
                                    <div className="bar" style={{width: `${Math.min(percentage, 100)}%`, backgroundColor: color}}></div>
                                    <span>{event.currentRegistrations}/{event.maxRegistrations}</span>
                                  </div>
                                </td>
                                <td>
                                  <div style={{position: 'relative'}}>
                                    <button className="menu-btn" onClick={() => setOpenMenu(openMenu === event._id ? null : event._id)}>⋮</button>
                                    {openMenu === event._id && (
                                      <div className="menu-dropdown">
                                        <button onClick={() => { setEditingEvent(event); setNewEvent({...event, banner: null}); setBannerPreview(getEventBanner(event)); setShowForm(true); setOpenMenu(null); }}>Edit</button>
                                        <button onClick={() => { handleDeleteEvent(event._id); setOpenMenu(null); }}>Delete</button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                {activeTab === 'upcoming' && (
                  <div className="events-card upcoming">
                    <h3>Upcoming</h3>
                    {loading ? (
                      <p>⏳ Loading...</p>
                    ) : error ? (
                      <p className="error-text">{error}</p>
                    ) : upcomingEventsFiltered.length === 0 ? (
                      <p>No upcoming events.</p>
                    ) : (
                      <table className="events-table">
                        <thead>
                          <tr>
                            <th>Event Name</th>
                            <th>Date & Time</th>
                            <th>Registrations</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcomingEventsFiltered.map((event) => {
                            const startTime = formatTime12Hour(event.startTime);
                            const percentage = event.maxRegistrations > 0 ? (event.currentRegistrations / event.maxRegistrations) * 100 : 0;
                            const color = percentage <= 50 ? '#10b981' : percentage <= 75 ? '#f59e0b' : '#ef4444';
                            return (
                              <tr key={event._id}>
                                <td>
                                  <div className="event-name-col">
                                    <strong>{event.title}</strong>
                                    {event.description && <p>{event.description}</p>}
                                  </div>
                                </td>
                                <td>{new Date(event.date).toLocaleDateString()} at {startTime}</td>
                                <td>
                                  <div className="registration-bar">
                                    <div className="bar" style={{width: `${Math.min(percentage, 100)}%`, backgroundColor: color}}></div>
                                    <span>{event.currentRegistrations}/{event.maxRegistrations}</span>
                                  </div>
                                </td>
                                <td>
                                  <div style={{position: 'relative'}}>
                                    <button className="menu-btn" onClick={() => setOpenMenu(openMenu === event._id ? null : event._id)}>⋮</button>
                                    {openMenu === event._id && (
                                      <div className="menu-dropdown">
                                        <button onClick={() => { setEditingEvent(event); setNewEvent({...event, banner: null}); setBannerPreview(getEventBanner(event)); setShowForm(true); setOpenMenu(null); }}>Edit</button>
                                        <button onClick={() => { handleDeleteEvent(event._id); setOpenMenu(null); }}>Delete</button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
                {activeTab === 'completed' && (
                  <div className="events-card completed">
                    <h3>Completed</h3>
                    {loading ? (
                      <p>⏳ Loading...</p>
                    ) : error ? (
                      <p className="error-text">{error}</p>
                    ) : completedEventsFiltered.length === 0 ? (
                      <p>No completed events.</p>
                    ) : (
                      <table className="events-table">
                        <thead>
                          <tr>
                            <th>Event Name</th>
                            <th>Date & Time</th>
                            <th>Registrations</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {completedEventsFiltered.map((event) => {
                            const startTime = formatTime12Hour(event.startTime);
                            const percentage = event.maxRegistrations > 0 ? (event.currentRegistrations / event.maxRegistrations) * 100 : 0;
                            const color = percentage <= 50 ? '#10b981' : percentage <= 75 ? '#f59e0b' : '#ef4444';
                            return (
                              <tr key={event._id}>
                                <td>
                                  <div className="event-name-col">
                                    <strong>{event.title}</strong>
                                    {event.description && <p>{event.description}</p>}
                                  </div>
                                </td>
                                <td>{new Date(event.date).toLocaleDateString()} at {startTime}</td>
                                <td>
                                  <div className="registration-bar">
                                    <div className="bar" style={{width: `${Math.min(percentage, 100)}%`, backgroundColor: color}}></div>
                                    <span>{event.currentRegistrations}/{event.maxRegistrations}</span>
                                  </div>
                                </td>
                                <td>
                                  <div style={{position: 'relative'}}>
                                    <button className="menu-btn" onClick={() => setOpenMenu(openMenu === event._id ? null : event._id)}>⋮</button>
                                    {openMenu === event._id && (
                                      <div className="menu-dropdown">
                                        <button onClick={() => { navigate('?tab=reports'); setOpenMenu(null); }}>Feedback</button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Dashboard Header */}
            <div className="admin-header">
              <div>
                <h1>Welcome back, Admin! 👋</h1>
                <p className="subtitle">Here's your event management dashboard overview.</p>
              </div>
              <button 
                className="view-reports-btn"
                onClick={() => navigate('?tab=reports')}
              >
                View Reports
              </button>
            </div>
            {/* Dashboard Stats Grid */}
            <div className="dashboard-grid">
              <div className="dashboard-card card-purple">
                <div className="card-icon">📅</div>
                <div className="card-content">
                  <div className="card-label">Total Events</div>
                  <div className="card-value">{events.length}</div>
                  <div className="card-meta">All time</div>
                </div>
              </div>

              <div className="dashboard-card card-cyan">
                <div className="card-icon">👥</div>
                <div className="card-content">
                  <div className="card-label">Total Registrations</div>
                  <div className="card-value">{totalRegistrations.toLocaleString()}</div>
                  <div className="card-meta">Across events</div>
                </div>
              </div>

              <div className="dashboard-card card-orange">
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <div className="card-label">Average Fill Rate</div>
                  <div className="card-value">{avgFillRate}%</div>
                  <div className="card-meta">Capacity</div>
                </div>
              </div>

              <div className="dashboard-card card-blue">
                <div className="card-icon">⏰</div>
                <div className="card-content">
                  <div className="card-label">Upcoming Events</div>
                  <div className="card-value">{upcomingEvents}</div>
                  <div className="card-meta">Next 30 days</div>
                </div>
              </div>
            </div>

            {message && (
              <div className={`admin-message ${message.includes("✓") ? "success" : "error"}`}>
                {message}
              </div>
            )}

            <div className="add-event-between">
              <button className="add-event-main-btn" onClick={() => setShowForm(true)}>ADD EVENT</button>
            </div>

            {showForm && (
              <div className="modal-backdrop">
                <div className="modal-content">
                  <button className="modal-close" onClick={() => { setShowForm(false); setNewEvent({
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
                  }); setBannerPreview(null); }}>×</button>
                  <form onSubmit={handleAddEvent} className="add-event-form">
                    <h3>Add New Event</h3>
                    <div className="form-group">
                      <label>Event Name</label>
                      <input type="text" name="title" value={newEvent.title} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <input type="text" name="category" value={newEvent.category} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea name="description" value={newEvent.description} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Event Poster</label>
                      <input type="file" accept="image/*,application/pdf" onChange={handleBannerChange} />
                      {bannerPreview && <img src={bannerPreview} alt="Banner Preview" className="banner-preview" />}
                    </div>
                    <div className="form-group">
                      <label>Date</label>
                      <input type="date" name="date" value={newEvent.date} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Start Time</label>
                      <input type="time" name="startTime" value={newEvent.startTime} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>End Time</label>
                      <input type="time" name="endTime" value={newEvent.endTime} onChange={handleInputChange} required />
                    </div>
                    <div className="form-group">
                      <label>Venue</label>
                      <select name="hall" value={newEvent.hall} onChange={handleInputChange} required>
                        <option value="">Select Hall</option>
                        {halls.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Max Registrations</label>
                      <input type="number" name="maxRegistrations" value={newEvent.maxRegistrations} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Department</label>
                      <input type="text" name="department" value={newEvent.department} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Organizer Name</label>
                      <input type="text" name="organizerName" value={newEvent.organizerName} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Organizer Contact</label>
                      <input type="text" name="organizerContact" value={newEvent.organizerContact} onChange={handleInputChange} />
                    </div>
                    <div className="form-group">
                      <label>Organizer Info</label>
                      <textarea name="organizerInfo" value={newEvent.organizerInfo} onChange={handleInputChange} />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn-submit">Create Event</button>
                      <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setNewEvent({
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
                      }); setBannerPreview(null); }}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Events List Section */}
            <div className="events-list-section">
              <div className="events-list-header">
                <h2>📋 Events List</h2>
                <button onClick={() => navigate('?tab=manage-events')} className="view-all-link">View All</button>
              </div>

              {loading ? (
                <p>⏳ Loading events...</p>
              ) : error ? (
                <p className="error-text">{error}</p>
              ) : events.length === 0 ? (
                <p className="no-events">No events yet.</p>
              ) : (
                <table className="events-table">
                  <thead>
                    <tr>
                      <th>Event Name</th>
                      <th>Department</th>
                      <th>Date & Time</th>
                      <th>Seminar Hall</th>
                      <th>Capacity</th>
                      <th>Registered</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .slice(0, 5)
                      .map((event) => {
                        const startTime = formatTime12Hour(event.startTime);
                        const hallName = halls.find(h => h._id === event.hall)?.name || event.hall || "TBD";
                        return (
                          <tr key={event._id}>
                            <td>
                              <div className="event-name-col">
                                <strong>{event.title}</strong>
                                {event.description && <p>{event.description}</p>}
                              </div>
                            </td>
                            <td>{event.department || "General"}</td>
                            <td>{new Date(event.date).toLocaleDateString()} at {startTime}</td>
                            <td>{hallName}</td>
                            <td>{event.maxRegistrations || 100}</td>
                            <td className="registered-count">{event.currentRegistrations || 0}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default AdminPanel;
