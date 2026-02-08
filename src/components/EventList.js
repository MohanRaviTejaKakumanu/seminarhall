import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import API from "../api";
import "./EventList.css";

export default function EventList() {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter states
  const [filters, setFilters] = useState({
    date: "",
    category: "",
    hall: "",
    department: "",
  });
  const [halls, setHalls] = useState([]);
  const [categories, setCategories] = useState([]);

  // Fetch events from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all events matching backend Event schema
        const eventsRes = await API.get("/events");
        const eventData = eventsRes.data || [];

        // Only show active, approved events
        const approvedEvents = eventData.filter(
          (e) => e.status === "active" && e.approved !== false,
        );
        setEvents(approvedEvents);
        setFilteredEvents(approvedEvents);

        // Fetch halls for filter dropdown
        const hallsRes = await API.get("/halls");
        setHalls(hallsRes.data || []);

        // Extract unique categories from events
        const uniqueCategories = [
          ...new Set(approvedEvents.map((e) => e.category).filter(Boolean)),
        ];
        setCategories(uniqueCategories);

        setError(null);
      } catch (err) {
        console.error("Error fetching events:", err);
        setError("Failed to load events. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
        (e) =>
          e.hall === filters.hall || (e.hall && e.hall._id === filters.hall),
      );
    }

    if (filters.department) {
      result = result.filter((e) =>
        e.department?.toLowerCase().includes(filters.department.toLowerCase()),
      );
    }

    setFilteredEvents(result);
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle filter button click
  const handleFilter = () => {
    applyFilters();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      date: "",
      category: "",
      hall: "",
      department: "",
    });
    setFilteredEvents(events);
  };

  // Determine if event is full
  const isEventFull = (event) => {
    return event.currentRegistrations >= event.maxRegistrations;
  };

  // Get hall name from hall object or fallback
  const getHallName = (hall) => {
    if (!hall) return "TBD";
    return typeof hall === "string" ? hall : hall.name;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      active: "#10b981",
      cancelled: "#ef4444",
      completed: "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  if (error) {
    return (
      <div className="events-page">
        <h2>🎉 Discover Events</h2>
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="events-page">
      <h2>🎉 Discover Events</h2>
      <p className="subtitle">Find and register for amazing college events</p>

      {/* Filters */}
      <div className="filters">
        <input
          type="date"
          name="date"
          value={filters.date}
          onChange={handleFilterChange}
        />
        <select
          name="category"
          value={filters.category}
          onChange={handleFilterChange}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select name="hall" value={filters.hall} onChange={handleFilterChange}>
          <option value="">All Locations</option>
          {halls.map((hall) => (
            <option
              key={hall._id || hall.hallId}
              value={hall._id || hall.hallId}
            >
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
        <button className="filter-btn" onClick={handleFilter}>
          🔍 Filter
        </button>
        <button className="reset-btn" onClick={resetFilters}>
          ↻ Reset
        </button>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="loading-state">
          <p>⏳ Loading events...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="empty">
          😕 <b>No events found</b>
          <p>
            {filters.date ||
            filters.category ||
            filters.hall ||
            filters.department
              ? "Try adjusting your filters"
              : "No events available at the moment"}
          </p>
        </div>
      ) : (
        <div className="event-grid">
          {filteredEvents.map((event) => (
            <div className="event-card" key={event._id || event.eventId}>
              {/* Status Badge */}
              <div
                className="event-badge"
                style={{ backgroundColor: getStatusColor(event.status) }}
              >
                {event.status.toUpperCase()}
              </div>

              {/* Category Badge */}
              {event.category && (
                <div className="category-badge">{event.category}</div>
              )}

              {/* Card Content */}
              <div className="card-content">
                <h3>{event.title}</h3>
                <p className="organizer">
                  👤 {event.organizerName || "Event Team"}
                </p>
                <p className="description">
                  {event.description?.substring(0, 80)}...
                </p>

                <div className="event-meta">
                  <p>
                    <strong>📅 Date:</strong>{" "}
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>🕐 Time:</strong> {event.startTime} -{" "}
                    {event.endTime}
                  </p>
                  <p>
                    <strong>📍 Hall:</strong> {getHallName(event.hall)}
                  </p>
                  <p>
                    <strong>🏢 Dept:</strong> {event.department}
                  </p>
                  <p>
                    <strong>👥 Capacity:</strong> {event.currentRegistrations}/
                    {event.maxRegistrations}
                    {isEventFull(event) && (
                      <span className="full-badge">FULL</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="card-actions">
                {isEventFull(event) ? (
                  <button className="btn-disabled" disabled>
                    Event Full
                  </button>
                ) : event.status !== "active" ? (
                  <button className="btn-disabled" disabled>
                    {event.status}
                  </button>
                ) : user?.role === "student" ? (
                  <a
                    href={`/event/${event._id || event.eventId}`}
                    className="btn-register"
                  >
                    Register →
                  </a>
                ) : (
                  <button className="btn-disabled" disabled>
                    Login to Register
                  </button>
                )}
                <a
                  href={`/event/${event._id || event.eventId}`}
                  className="btn-details"
                >
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
