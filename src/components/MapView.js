// frontend/src/components/MapView.js
import React, { useEffect, useState } from "react";
import API from "../api";
import HallEventsOnMap from "./HallEventsOnMap";

const MapView = () => {
  const [halls, setHalls] = useState([]);
  const [selectedHall, setSelectedHall] = useState(null);

  useEffect(() => {
    API.get("/halls").then((res) => setHalls(res.data));
  }, []);

  return (
    <div className="map-view">
      <h2>Interactive College Blueprint</h2>
      <div className="map-layout">
        <div className="hall-list">
          <h3>Seminar Halls</h3>
          <ul>
            {halls.map((h) => (
              <li key={h._id} onClick={() => setSelectedHall(h)}>
                {h.name} ({h.building}, {h.floor})
              </li>
            ))}
          </ul>
        </div>
        <div className="hall-events">
          <HallEventsOnMap hall={selectedHall} />
        </div>
      </div>
    </div>
  );
};

export default MapView;