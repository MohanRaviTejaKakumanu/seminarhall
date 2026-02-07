import React, { useEffect, useState, useContext } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";
import "./EventList.css";

const EventList = ({ onSelect }) => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [halls, setHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: "",
    hallId: "",
    department: "",
    category: "",
    search: ""
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.date) params.date = filters.date;
      if (filters.hallId) params.hallId = filters.hallId;
      if (filters.department) params.department = filters.department;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const [evRes, hallRes] = await Promise.all([
        API.get("/events", { params }),
        API.get("/halls")
      ]);
      setEvents(evRes.data);
      setHalls(hallRes.data);
    } catch (err) {
      console.error("Error loading events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const applyFilters = (e) => {
    e.preventDefault();
    load();
  };

  const clearFilters = () => {
    setFilters({
      date: "",
      hallId: "",
      department: "",
      category: "",
      search: ""
    });
  };

  return (
    <div className="events-container">
      <div className="events-header">
        <h2>📅 Discover Events</h2>
        <p>Find and register for amazing college events</p>
      </div>

      <form className="filters" onSubmit={applyFilters}>
        <div className="filter-group">
          <input
            type="text"
            placeholder="🔍 Search events..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="filter-input"
          />
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="filter-input"
            >
              <option value="">All Categories</option>
              <option value="Academic">Academic</option>
              <option value="Sports">Sports</option>
              <option value="Cultural">Cultural</option>
              <option value="Workshop">Workshop</option>
              <option value="Seminar">Seminar</option>
              <option value="Conference">Conference</option>
              <option value="Social">Social</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={filters.hallId}
              onChange={(e) => setFilters({ ...filters, hallId: e.target.value })}
              className="filter-input"
            >
              <option value="">All Locations</option>
              {halls.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <input
              type="text"
              placeholder="Department"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="filter-input"
            />
          </div>
        </div>

        <div className="filter-actions">
          <button type="submit" className="btn-filter">🔍 Filter</button>
          <button type="button" onClick={clearFilters} className="btn-clear">Clear Filters</button>
        </div>
      </form>

      {loading ? (
        <div className="loading-state">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="no-events">
          <p>😢 No events found. Try adjusting your filters!</p>
        </div>
      ) : (
        <ul className="event-list">
          {events.map((ev) => (
            <li key={ev._id} onClick={() => onSelect(ev._id)} className="event-list-item">
              <div className="event-list-content">
                <div className="event-list-left">
                  <div className="event-date-badge">
                    <span className="day">{new Date(ev.date).getDate()}</span>
                    <span className="month">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>
                </div>
                <div className="event-list-middle">
                  <h3>{ev.title}</h3>
                  <p className="event-category">{ev.category}</p>
                  {ev.department && <p className="event-dept">🏢 {ev.department}</p>}
                  <p className="event-time">🕐 {ev.startTime} - {ev.endTime}</p>
                  {ev.hall && <p className="event-location">📍 {ev.hall?.name}</p>}
                </div>
                <div className="event-list-right">
                  <p className="event-registrations">👥 {ev.currentRegistrations || 0}/{ev.maxRegistrations}</p>
                  <button className="btn-view" onClick={(e) => { e.stopPropagation(); onSelect(ev._id); }}>
                    View Details →
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!user && (
        <div className="login-prompt">
          <p>✨ Want to register for events? <strong>Login or Sign Up</strong> to get started!</p>
        </div>
      )}
    </div>
  );
};

export default EventList;