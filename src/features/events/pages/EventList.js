import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { ThemeContext } from "../../../context/ThemeContext";
import API from "../../../api";
import "../EventList.css";

export default function EventList() {
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);

  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    date: "",
    category: "",
    hall: "",
    department: "",
  });

  const [halls, setHalls] = useState([]);
  const [categories, setCategories] = useState([]);

  // 🔥 Banner helper (ADMIN PANEL banner support)
  const getEventBanner = (event) => {
    if (event?.banner) {
      return event.banner.startsWith("http")
        ? event.banner
        : `${process.env.REACT_APP_API_URL}/${event.banner}`;
    }
    return "/default-event-banner.jpg";
  };

  // Fetch events
  const fetchData = async () => {
    try {
      setLoading(true);

      const eventsRes = await API.get("/events");
      const eventData = eventsRes.data || [];

      const approvedEvents = eventData.filter(
        (e) => e.status === "active" && e.approved !== false
      );

      setEvents(approvedEvents);
      setFilteredEvents(approvedEvents);

      const hallsRes = await API.get("/halls");
      setHalls(hallsRes.data || []);

      const uniqueCategories = [
        ...new Set(approvedEvents.map((e) => e.category).filter(Boolean)),
      ];
      setCategories(uniqueCategories);

      setError(null);
    } catch (err) {
      console.error("Error fetching events:", err);
      if (err.message === "Network Error") {
        setError("❌ Network Error: Unable to connect to server. Please check if the backend is running on port 5000.");
      } else if (err.response?.status === 401) {
        setError("❌ Unauthorized. Please login again.");
      } else if (err.response?.status === 403) {
        setError("❌ Access Denied.");
      } else if (err.response?.status === 500) {
        setError("❌ Server Error. Please try again later.");
      } else {
        setError("❌ Failed to load events. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply filters
  const applyFilters = () => {
    let result = [...events];

    if (filters.date) {
      result = result.filter((e) => {
        const eventDate = new Date(e.date).toISOString().split("T")[0];
        return eventDate === filters.date;
      });
    }

    if (filters.category) {
      result = result.filter((e) => e.category === filters.category);
    }

    if (filters.hall) {
      result = result.filter(
        (e) => e.hall === filters.hall || e.hall?._id === filters.hall
      );
    }

    if (filters.department) {
      result = result.filter((e) =>
        e.department?.toLowerCase().includes(filters.department.toLowerCase())
      );
    }

    setFilteredEvents(result);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({ date: "", category: "", hall: "", department: "" });
    setFilteredEvents(events);
  };

  const isEventFull = (event) =>
    event.currentRegistrations >= event.maxRegistrations;

  const getHallName = (hall) =>
    !hall ? "TBD" : typeof hall === "string" ? hall : hall.name;

  const getStatusColor = (status) => {
    const colors = {
      active: "#10b981",
      cancelled: "#ef4444",
      completed: "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  // don't early-return on error; render header + filters and show a clear banner
  // and fallback placeholders so the page layout remains visible even offline

  return (
    <div className={`events-page ${isDarkMode ? "dark-mode" : ""}`}>
      <h2>🎉 Discover Events</h2>
      <p className="subtitle">Find and register for amazing college events</p>
      {error && (
        <div className="error-message" role="alert" style={{marginBottom:12, display:'flex', alignItems:'center', justifyContent:'space-between'}}>
          <div>{error}</div>
          <div>
            <button className="filter-btn" onClick={() => fetchData()} style={{marginRight:8}}>Retry</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <input type="date" name="date" value={filters.date} onChange={handleFilterChange} />

        <select name="category" value={filters.category} onChange={handleFilterChange}>
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select name="hall" value={filters.hall} onChange={handleFilterChange}>
          <option value="">All Locations</option>
          {halls.map((hall) => (
            <option key={hall._id} value={hall._id}>
              {hall.name} ({hall.building})
            </option>
          ))}
        </select>

        <input
          type="text"
          name="department"
          placeholder="Department"
          value={filters.department}
          onChange={handleFilterChange}
        />

        <button className="filter-btn" onClick={applyFilters}>🔍 Filter</button>
        <button className="reset-btn" onClick={resetFilters}>↻ Reset</button>
      </div>

      {/* Events */}
      {loading ? (
        <div className="loading-state">⏳ Loading events...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty">
          😕 <b>No events found</b>
        </div>
      ) : (
        <div className="event-grid">
          {filteredEvents.map((event) => (
            <div className="event-card" key={event._id}>

              {/* 🔥 Banner */}
              <div className="event-card-img">
                <img
                  src={getEventBanner(event)}
                  alt={event.title}
                  className="event-banner"
                />

                <div
                  className="event-badge"
                  style={{ backgroundColor: getStatusColor(event.status) }}
                >
                  {event.status.toUpperCase()}
                </div>

                {event.category && (
                  <div className="category-badge">{event.category}</div>
                )}
              </div>

              {/* Content */}
              <div className="card-content">
                <h3>{event.title}</h3>
                <p className="organizer">👤 {event.organizerName || "Event Team"}</p>

                <p className="description">
                  {event.description?.substring(0, 80)}...
                </p>

                <div className="event-meta">
                  <p><strong>📅</strong> {new Date(event.date).toLocaleDateString()}</p>
                  <p><strong>🕐</strong> {event.startTime} - {event.endTime}</p>
                  <p><strong>📍</strong> {getHallName(event.hall)}</p>
                  <p><strong>👥</strong> {event.currentRegistrations}/{event.maxRegistrations}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="card-actions">
                {isEventFull(event) ? (
                  <button className="btn-disabled" disabled>Event Full</button>
                ) : user?.role === "student" ? (
                  <a href={`/event/${event._id}`} className="btn-register">
                    Register →
                  </a>
                ) : (
                  <button className="btn-disabled" disabled>Login to Register</button>
                )}

                <a href={`/event/${event._id}`} className="btn-details">
                  Details
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
