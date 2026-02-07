import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h3>College Events</h3>

      <div>
        <Link to="/events">Events</Link>
        <Link to="/events">Dashboard</Link>
        <Link to="/my-events">My Events</Link>
        <Link to="/calendar">Calendar</Link>
        <Link to="/map">Map</Link>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
