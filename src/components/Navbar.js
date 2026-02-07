import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <h3>College Events</h3>

      <div>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/events">Events</Link>
        <Link to="/myevents">My Events</Link>
        <Link to="/calendar">Calendar</Link>
        <Link to="/map">Map</Link>
        <button onClick={() => navigate("/login")}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
