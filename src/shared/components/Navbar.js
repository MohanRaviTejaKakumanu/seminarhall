import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import API from "../../api";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await API.get("/notifications/my-notifications");
        const unread = (res.data || []).filter((n) => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error fetching notification count:", err);
      }
    };

    fetchUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <h2 className="logo">🎓 College Events</h2>

      <div className="nav-links">
        <Link to="/events">Events</Link>
        <Link to="/my-events">My Events</Link>
        <Link to="/calendar">Calendar</Link>
        <Link to="/map">Map</Link>
        {user?.role === "admin" && (
          <Link to="/admin" className="admin-link">
            🎛️ Admin Panel
          </Link>
        )}
        <Link to="/notifications" className="notifications-link">
          🔔 Notifications
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount}</span>
          )}
        </Link>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
