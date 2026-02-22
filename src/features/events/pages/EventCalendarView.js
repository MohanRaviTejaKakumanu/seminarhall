import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import API from '../../../api';
import './EventsPage.css';

const EventCalendarView = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await API.get('/events');
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };
    fetchEvents();
  }, []);

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date) => {
    if (!date) return [];
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + direction);
      return newDate;
    });
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="my-events-page">
      <div className="calendar-header">
        <button onClick={() => navigateMonth(-1)} className="calendar-nav-btn">‹</button>
        <h2>{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
        <button onClick={() => navigateMonth(1)} className="calendar-nav-btn">›</button>
      </div>

      <div className="calendar-grid">
        <div className="calendar-day-header">Sun</div>
        <div className="calendar-day-header">Mon</div>
        <div className="calendar-day-header">Tue</div>
        <div className="calendar-day-header">Wed</div>
        <div className="calendar-day-header">Thu</div>
        <div className="calendar-day-header">Fri</div>
        <div className="calendar-day-header">Sat</div>

        {days.map((date, index) => {
          const dayEvents = getEventsForDate(date);
          return (
            <div key={index} className={`calendar-day ${!date ? 'empty' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}>
              {date && (
                <>
                  <div className="calendar-day-number">{date.getDate()}</div>
                  <div className="calendar-events">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event._id}
                        className="calendar-event-item"
                        onClick={() => handleViewDetails(event)}
                      >
                        <div className="calendar-event-title">{event.title}</div>
                        <div className="calendar-event-time">{event.time}</div>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="calendar-more-events">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Event Details Modal */}
      {showModal && selectedEvent && (
        <div className="event-modal-overlay" onClick={closeModal}>
          <div className="event-modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>×</button>
            <div className="modal-header-bar"></div>
            <div className="modal-title-dept">
              <h2>{selectedEvent.title}</h2>
              <p className="modal-department">{selectedEvent.department}</p>
            </div>
            <p className="modal-description">{selectedEvent.description}</p>
            <div className="modal-details">
              <div className="detail-row">
                <strong>Date:</strong>
                <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
              </div>
              <div className="detail-row">
                <strong>Time:</strong>
                <span>{selectedEvent.time}</span>
              </div>
              <div className="detail-row">
                <strong>Venue:</strong>
                <span>{selectedEvent.venue}</span>
              </div>
              <div className="detail-row">
                <strong>Capacity:</strong>
                <span>{selectedEvent.capacity}</span>
              </div>
            </div>
            <div className="modal-tags">
              {selectedEvent.tags?.map(tag => (
                <span key={tag} className="modal-tag">{tag}</span>
              ))}
            </div>
            <div className="modal-actions">
              <button className="btn-close" onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendarView;