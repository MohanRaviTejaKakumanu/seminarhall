import { Link, useNavigate, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { ThemeContext } from "../../context/ThemeContext";
import API from "../../api";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Update body class for sidebar state
  useEffect(() => {
    if (!sidebarOpen) {
      document.body.classList.add('sidebar-collapsed');
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    return () => {
      document.body.classList.remove('sidebar-collapsed');
    };
  }, [sidebarOpen]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
      <nav className={`navbar ${sidebarOpen ? "sidebar-open" : "sidebar-collapsed"} ${isDarkMode ? "dark-mode" : ""}`}>
        <h2 className="logo">🎓 College Events</h2>
        
        {/* Right side items - Notification and Dark Mode */}
        <div className="navbar-right">
          <Link to="/notifications" className="notif-link">
            🔔
            {unreadCount > 0 && (
              <span className="notif-badge">{unreadCount}</span>
            )}
          </Link>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </nav>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"} ${isDarkMode ? "dark-mode" : ""}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header" onClick={toggleSidebar}>
          <div className="sidebar-brand">
            <div className="brand-icon">{user?.role === "admin" ? "⚙️" : "🎓"}</div>
            <div className="brand-text">
              <div className="brand-name">{user?.role === "admin" ? "Admin Panel" : "SeminarHub"}</div>
              {user?.role !== "admin" && <div className="brand-subtitle">Student Dashboard</div>}
            </div>
          </div>
        </div>

        {/* Sidebar Menu */}
        <div className="sidebar-menu">
          {user?.role === "student" && (
            <>
              <Link 
                to="/events" 
                className={`sidebar-link ${location.pathname === "/events" ? "active" : ""}`}
              >
                <span className="link-icon">🏠</span>
                <span className="link-text">Dashboard</span>
              </Link>
              <Link 
                to="/my-events" 
                className={`sidebar-link ${location.pathname === "/my-events" ? "active" : ""}`}
              >
                <span className="link-icon">📋</span>
                <span className="link-text">Events</span>
              </Link>
              <Link 
                to="/calendar" 
                className={`sidebar-link ${location.pathname === "/calendar" ? "active" : ""}`}
              >
                <span className="link-icon">📅</span>
                <span className="link-text">Calendar</span>
              </Link>
              <Link 
                to="/map" 
                className={`sidebar-link ${location.pathname === "/map" ? "active" : ""}`}
              >
                <span className="link-icon">🗺️</span>
                <span className="link-text">Map</span>
              </Link>
            </>
          )}

          {user?.role === "admin" && (
            <>
              <Link 
                to="/admin" 
                className={`sidebar-link ${location.pathname === "/admin" && !location.search ? "active" : ""}`}
              >
                <span className="link-icon">🏠</span>
                <span className="link-text">Dashboard</span>
              </Link>
              <Link 
                to="/admin?tab=manage-events" 
                className={`sidebar-link ${location.search.includes("tab=manage-events") ? "active" : ""}`}
              >
                <span className="link-icon">📝</span>
                <span className="link-text">Manage Events</span>
              </Link>
              <Link 
                to="/admin?tab=calendar" 
                className={`sidebar-link ${location.search.includes("tab=calendar") ? "active" : ""}`}
              >
                <span className="link-icon">📅</span>
                <span className="link-text">Event Calendar</span>
              </Link>
              <Link 
                to="/admin?tab=reports" 
                className={`sidebar-link ${location.search.includes("tab=reports") ? "active" : ""}`}
              >
                <span className="link-icon">📊</span>
                <span className="link-text">Reports</span>
              </Link>
            </>
          )}
        </div>

        {/* Logout Button */}
        <button className="sidebar-logout" onClick={handleLogout}>
          <span className="logout-icon">↩️</span>
          <span className="logout-text">Logout</span>
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && window.innerWidth < 768 && <div className="overlay" onClick={() => setSidebarOpen(false)} />}
    </>
  );
}
