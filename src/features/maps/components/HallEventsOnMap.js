// frontend/src/features/maps/components/HallEventsOnMap.js
import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "../../../context/ThemeContext";
import API from "../../../api";

const HallEventsOnMap = ({ hall }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [eventsByDate, setEventsByDate] = useState({});

  useEffect(() => {
    if (!hall) return;
    API.get("/events", { params: { hallId: hall._id } }).then((res) => {
      const grouped = {};
      res.data.forEach((ev) => {
        const d = new Date(ev.date).toDateString();
        if (!grouped[d]) grouped[d] = [];
        grouped[d].push(ev);
      });
      setEventsByDate(grouped);
    });
  }, [hall]);

  if (!hall) return <p>Select a hall on the left.</p>;

  return (
    <div className={`hall-events ${isDarkMode ? "dark-mode" : ""}`}>
      <h3>Events in {hall.name}</h3>
      {Object.keys(eventsByDate).length === 0 && <p>No events.</p>}
      {Object.entries(eventsByDate).map(([date, events]) => (
        <div key={date}>
          <h4>{date}</h4>
          <ul>
            {events.map((ev) => (
              <li key={ev._id}>
                {ev.title} ({ev.startTime} - {ev.endTime})
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default HallEventsOnMap;
