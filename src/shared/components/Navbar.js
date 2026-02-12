import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import API from "../../api";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // Fetch unread notifications count
  useEffect(() => {
    if (!user) return;

    const fetchUnreadCount = async () => {
      try {
        const res = await API.get("/notifications/my-notifications");
        const unread = (res.data || []).filter(n => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error fetching notification count:", err);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <>
      {/* Top Navbar */}
      <nav className="navbar">
        <button className="menu-btn" onClick={() => setOpen(true)}>☰</button>
        <h2 className="logo">🎓 College Events</h2>
      </nav>

      {/* Sidebar */}
      <div className={`sidebar ${open ? "open" : ""}`}>
        <button className="close-btn" onClick={() => setOpen(false)}>✖</button>

        <Link to="/events" onClick={() => setOpen(false)}>Events</Link>
        <Link to="/my-events" onClick={() => setOpen(false)}>My Events</Link>
        <Link to="/calendar" onClick={() => setOpen(false)}>Calendar</Link>
        <Link to="/map" onClick={() => setOpen(false)}>Map</Link>

        {user?.role === "admin" && (
          <Link to="/admin" onClick={() => setOpen(false)}>
            🎛️ Admin Panel
          </Link>
        )}

        <Link to="/notifications" onClick={() => setOpen(false)}>
          🔔 Notifications
          {unreadCount > 0 && (
            <span className="notif-badge">{unreadCount}</span>
          )}
        </Link>

        <button className="logout-btn sidebar-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Overlay */}
      {open && <div className="overlay" onClick={() => setOpen(false)} />}
    </>
  );
}
