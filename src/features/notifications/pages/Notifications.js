import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../../../context/AuthContext";
import { ThemeContext } from "../../../context/ThemeContext";
import API from "../../../api";
import "../Notifications.css";

const Notifications = () => {
  const { user } = useContext(AuthContext);
  const { isDarkMode } = useContext(ThemeContext);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);

  // Fetch notifications for the user
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await API.get("/notifications/my-notifications");
        const notifData = res.data || [];
        setNotifications(notifData);

        // Count unread
        const unread = notifData.filter((n) => !n.read).length;
        setUnreadCount(unread);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Mark as read
  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // Fetch registrations for a notification (admin only)
  const fetchRegistrations = async (notificationId) => {
    try {
      setRegistrationsLoading(true);
      const res = await API.get(`/notifications/${notificationId}/registrations`);
      setRegistrations(res.data || []);
    } catch (err) {
      console.error("Error fetching registrations:", err);
      setRegistrations([]);
    } finally {
      setRegistrationsLoading(false);
    }
  };

  // Handle notification click for admin
  const handleNotificationClick = (notification) => {
    setSelectedNotification(notification);
    if (user?.role === "admin" && notification._id) {
      fetchRegistrations(notification._id);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await API.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      if (selectedNotification?._id === notificationId) {
        setSelectedNotification(null);
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  if (loading) {
    return <div className="notifications-spinner">Loading...</div>;
  }

  // Admin view: Show selected notification with registrations
  if (user?.role === "admin" && selectedNotification) {
    return (
      <div className={`notifications-container ${isDarkMode ? "dark-mode" : ""}`}>
        <div className="notifications-header">
          <button onClick={() => setSelectedNotification(null)} className="btn-back">← Back</button>
          <h2>📋 Registrations for: {selectedNotification.title}</h2>
        </div>
        {registrationsLoading ? (
          <div className="registrations-spinner">Loading registrations...</div>
        ) : registrations.length === 0 ? (
          <div className="registrations-empty">
            <p>No registrations yet for this notification.</p>
          </div>
        ) : (
          <div className="registrations-list">
            <table className="registrations-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Event</th>
                  <th>Department</th>
                  <th>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg._id}>
                    <td>{reg.studentName || reg.student?.name || "N/A"}</td>
                    <td>{reg.studentEmail || reg.student?.email || "N/A"}</td>
                    <td>{reg.eventTitle || reg.event?.title || "N/A"}</td>
                    <td>{reg.studentDepartment || reg.student?.department || "N/A"}</td>
                    <td>{reg.registeredDate ? new Date(reg.registeredDate).toLocaleDateString() : "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`notifications-container ${isDarkMode ? "dark-mode" : ""}`}>
      <div className="notifications-header">
        <h2>🔔 Notifications</h2>
        {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
      </div>

      {notifications.length === 0 ? (
        <div className="notifications-empty">
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`notification-item ${notification.read ? "read" : "unread"}`}
              onClick={() => user?.role === "admin" && handleNotificationClick(notification)}
              style={user?.role === "admin" ? { cursor: "pointer" } : {}}
            >
              <div className="notification-content">
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <small>{notification.type}</small>
              </div>

              <div className="notification-actions">
                {!notification.read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markAsRead(notification._id); }}
                    className="btn-mark-read"
                  >
                    ✓
                  </button>
                )}
                {notification.actionUrl && (
                  <a href={notification.actionUrl} className="btn-action">
                    →
                  </a>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(notification._id); }}
                  className="btn-delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
