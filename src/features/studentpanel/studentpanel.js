import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import API from '../../api';
import './studentpanel.css';

const StudentPanel = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [myEvents, setMyEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const [eventsRes, myEventsRes] = await Promise.all([
          API.get('/events'),
          API.get('/my-events')
        ]);
        setEvents(eventsRes.data);
        setMyEvents(myEventsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleRegister = async (eventId) => {
    try {
      await API.post(`/events/${eventId}/register`);
      // Refresh my events
      const myEventsRes = await API.get('/my-events');
      setMyEvents(myEventsRes.data);
    } catch (error) {
      console.error('Error registering for event:', error);
    }
  };

  const activeEvents = events.filter(event => new Date(event.date) >= new Date());
  const upcomingEvents = events.filter(event => new Date(event.date) > new Date());
  const popularEvents = [...events].sort((a, b) => (b.registrations || 0) - (a.registrations || 0)).slice(0, 5);

  const cards = [
    { id: 'active', title: 'Active Events', emoji: '📅', count: activeEvents.length, subtitle: 'All time', color: '#9333EA' },
    { id: 'registrations', title: 'My Registrations', emoji: '📋', count: myEvents.length, subtitle: 'Across events', color: '#06B6D4' },
    { id: 'upcoming', title: 'Upcoming Events', emoji: '⏰', count: upcomingEvents.length, subtitle: 'Next 30 days', color: '#FB923C' },
    { id: 'popular', title: 'Popular Events', emoji: '🔥', count: popularEvents.length, subtitle: 'Most Popular', color: '#3B82F6' }
  ];

  const renderEventList = () => (
    <div className="event-list">
      {events.map(event => (
        <div key={event.id} className="event-card">
          <h3>{event.title}</h3>
          <p>{event.date} at {event.time}</p>
          <button onClick={() => setSelectedEvent(event)}>View Details</button>
          {!myEvents.find(me => me.id === event.id) && <button onClick={() => handleRegister(event.id)}>Register</button>}
        </div>
      ))}
    </div>
  );

  const renderEventDetails = () => (
    selectedEvent && (
      <div className="event-details-modal">
        <h2>{selectedEvent.title}</h2>
        <p>{selectedEvent.date} at {selectedEvent.time}</p>
        <p>Location: {selectedEvent.location}</p>
        <button onClick={() => setSelectedEvent(null)}>Close</button>
      </div>
    )
  );

  // Render the dashboard immediately for fast perceived performance.
  // Data will populate/update when the fetch completes (loading state kept for optional UI cues).

  return (
    <div className="student-panel">
      <div className="welcome-message">
        <h1>Welcome, {user?.name || 'Student'}!</h1>
        <div className="welcome-sub">
          <p>Here's your student dashboard overview.</p>
          <button className="view-events-inline" onClick={() => navigate('/my-events')}>View events</button>
        </div>
      </div>
      <div className="dashboard-cards">
        {cards.map(card => (
          <div
            key={card.id}
            className="card"
            style={{ backgroundColor: card.color }}
          >
            <div className="card-header">
              <span className="card-emoji">{card.emoji}</span>
              <h3>{card.title}</h3>
            </div>
            <p className="count">{card.count}</p>
            <p className="card-subtitle">{card.subtitle}</p>
          </div>
        ))}
      </div>
      {/* Recently added events table (data from backend) */}
      <div className="events-section">
        <h2>Recently Added Events</h2>
        <div className="events-table-wrapper">
          <table className="recent-events-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Event Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {(events || [])
                .slice()
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(0, 6)
                .map(ev => (
                  <tr key={ev.id} className="recent-event-row">
                    <td className="event-name">{ev.title}</td>
                    <td className="event-date">{new Date(ev.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</td>
                    <td className="event-action">
                      <button className="view-details-btn" onClick={() => navigate('/my-events')}>View Details</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {renderEventDetails()}
    </div>
  );
};

export default StudentPanel;
