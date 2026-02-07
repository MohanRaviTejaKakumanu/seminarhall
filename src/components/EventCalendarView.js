import React, { useEffect, useState } from "react";
import API from "../api";

const EventCalendarView = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    API.get("/events").then((res) => setEvents(res.data));
  }, []);

  // Very simple daily view: group by date
  const grouped = {};
  events.forEach((ev) => {
    const d = new Date(ev.date).toDateString();
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(ev);
  });

  return (
    <div className="calendar-view">
      <h2>Event Calendar</h2>
      {Object.keys(grouped).length === 0 && <p>No events.</p>}
      {Object.entries(grouped).map(([date, evs]) => (
        <div key={date} className="calendar-day">
          <h3>{date}</h3>
          <ul>
            {evs.map((ev) => (
              <li key={ev._id}>
                {ev.title} | {ev.startTime} - {ev.endTime} | {ev.hall?.name}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default EventCalendarView;