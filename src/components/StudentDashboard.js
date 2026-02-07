import React from "react";
import { useNavigate } from "react-router-dom";
import "./StudentDashboard.css";

const StudentDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <h1>Student Dashboard</h1>

      <div className="grid">
        <div onClick={() => navigate("/events")}>All Events</div>
        <div onClick={() => navigate("/myevents")}>My Events</div>
        <div onClick={() => navigate("/calendar")}>Calendar</div>
        <div onClick={() => navigate("/map")}>Campus Map</div>
      </div>
    </div>
  );
};

export default StudentDashboard;
