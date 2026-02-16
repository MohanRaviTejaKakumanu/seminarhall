import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "../../../context/ThemeContext";
import API from "../../../api";
import "./EventCalendarView.css";

const EventCalendarView = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await API.get("/events");
        setEvents(res.data || []);
        setError(null);
      } catch (err) {
        console.error("Calendar fetch error:", err);
        if (err.message === "Network Error") {
          setError("Network Error: Unable to reach backend. Please ensure the server is running.");
        } else {
          setError(err.response?.data?.msg || "Failed to load events.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // helper to format time to 12-hour
  const formatTime12Hour = (time24) => {
    if (!time24) return "TBD";
    const [h, m] = time24.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  };

  // Very simple daily view: group by date
  const grouped = {};
  (events || []).forEach((ev) => {
    const d = ev?.date ? new Date(ev.date).toDateString() : "Unknown Date";
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(ev);
  });

  return (
    <div className={`calendar-view ${isDarkMode ? "dark-mode" : ""}`}>
      <h2>Event Calendar</h2>

      {loading ? (
        <div className="calendar-empty">⏳ Loading events...</div>
      ) : error ? (
        <div className="calendar-empty error">{error}</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="calendar-empty">No events.</div>
      ) : (
        Object.entries(grouped).map(([date, evs]) => (
          <div key={date} className="calendar-day">
            <h3>{date}</h3>
            <ul>
              {evs.map((ev) => (
                <li key={ev._id}>
                  <strong>{ev.title}</strong> — {formatTime12Hour(ev.startTime)} - {formatTime12Hour(ev.endTime)}
                  {ev.hall?.name ? ` • ${ev.hall.name}` : ""}
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
};

export default EventCalendarView;
