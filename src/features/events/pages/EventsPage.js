import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../context/AuthContext';
import API from '../../../api';
import './EventsPage.css';

const EventsPage = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('active');
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    name: user?.name || '',
    branch: '',
    rollNo: '',
    email: user?.email || '',
    mobileNo: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState(null);

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

  const getFilteredEvents = () => {
    const now = new Date();
    switch (activeTab) {
      case 'recently-added':
        return [...events].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
      case 'active':
        return events.filter(event => new Date(event.date) >= now)
                     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
      case 'upcoming':
        return events.filter(event => new Date(event.date) > now)
                     .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
      case 'completed':
        return events.filter(event => new Date(event.date) < now);
      default:
        return events;
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleRegister = (event) => {
    setSelectedEvent(event);
    setShowRegistrationModal(true);
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/events/register', {
        eventId: selectedEvent._id,
        ...registrationForm
      });
      setSuccessMessage('Registration successful! You will receive a confirmation email shortly.');
      setShowRegistrationModal(false);
      setRegistrationForm({
        name: user?.name || '',
        branch: '',
        rollNo: '',
        email: user?.email || '',
        mobileNo: ''
      });
    } catch (error) {
      console.error('Error registering:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const closeRegistrationModal = () => {
    setShowRegistrationModal(false);
    setSelectedEvent(null);
    setSuccessMessage('');
  };

  const handlePosterClick = (posterUrl) => {
    setSelectedPoster(posterUrl);
    setShowPosterModal(true);
  };

  const closePosterModal = () => {
    setShowPosterModal(false);
    setSelectedPoster(null);
  };

  const filteredEvents = getFilteredEvents();

  return (
    <div className="my-events-page">
      <h2>My Events</h2>

      <div className="events-tabs">
        <button
          className={`tab-btn ${activeTab === 'recently-added' ? 'active' : ''}`}
          onClick={() => handleTabChange('recently-added')}
        >
          Recently Added
        </button>
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => handleTabChange('active')}
        >
          Active
        </button>
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => handleTabChange('upcoming')}
        >
          Upcoming
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => handleTabChange('completed')}
        >
          Completed
        </button>
      </div>

      <div className="events-grid">
        {filteredEvents.map(event => (
          <div key={event._id} className="event-item">
            <div className="event-header-bar"></div>
            {event.poster && (
              <div className="event-poster">
                <img
                  src={event.poster}
                  alt={`${event.title} poster`}
                  onClick={() => handlePosterClick(event.poster)}
                  className="event-poster-image"
                />
              </div>
            )}
            <div className="event-title-dept">
              <h3>{event.title}</h3>
              <p className="event-department">{event.department}</p>
            </div>
            <p className="event-description">{event.description}</p>
            <div className="event-details-row">
              <span>📅 {new Date(event.date).toLocaleDateString()}</span>
              <span>🕒 {event.time}</span>
              <span>📍 {event.venue}</span>
            </div>
            <div className="event-tags">
              {event.tags?.map(tag => (
                <span key={tag} className="event-tag">{tag}</span>
              ))}
            </div>
            <div className="event-capacity">
              <div className="capacity-text">
                <span>Capacity: {event.capacity - (event.registrations || 0)} spots left</span>
                <span className="spots-left">{event.capacity - (event.registrations || 0)}/{event.capacity}</span>
              </div>
              <div className="capacity-bar">
                <div
                  className="capacity-fill"
                  style={{ width: `${((event.registrations || 0) / event.capacity) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="event-actions">
              <button className="btn-view-details" onClick={() => handleViewDetails(event)}>
                View Details
              </button>
              <button className="btn-register" onClick={() => handleRegister(event)}>
                Register
              </button>
            </div>
          </div>
        ))}
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

      {/* Registration Modal */}
      {showRegistrationModal && selectedEvent && (
        <div className="registration-modal-overlay" onClick={closeRegistrationModal}>
          <div className="registration-modal-content" onClick={e => e.stopPropagation()}>
            <button className="registration-close" onClick={closeRegistrationModal}>×</button>
            {successMessage ? (
              <div className="registration-success">
                <h2>✅ Registration Successful!</h2>
                <p>{successMessage}</p>
              </div>
            ) : (
              <>
                <h2>Register for {selectedEvent.title}</h2>
                <form onSubmit={handleRegistrationSubmit}>
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={registrationForm.name}
                      onChange={e => setRegistrationForm({...registrationForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Branch</label>
                    <input
                      type="text"
                      value={registrationForm.branch}
                      onChange={e => setRegistrationForm({...registrationForm, branch: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Roll No</label>
                    <input
                      type="text"
                      value={registrationForm.rollNo}
                      onChange={e => setRegistrationForm({...registrationForm, rollNo: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email ID</label>
                    <input
                      type="email"
                      value={registrationForm.email}
                      onChange={e => setRegistrationForm({...registrationForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile No</label>
                    <input
                      type="tel"
                      value={registrationForm.mobileNo}
                      onChange={e => setRegistrationForm({...registrationForm, mobileNo: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" className="registration-btn-cancel" onClick={closeRegistrationModal}>
                      Cancel
                    </button>
                    <button type="submit" className="registration-btn-register">
                      Register
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Poster Modal */}
      {showPosterModal && selectedPoster && (
        <div className="poster-modal-overlay" onClick={closePosterModal}>
          <div className="poster-modal-content" onClick={e => e.stopPropagation()}>
            <button className="poster-modal-close" onClick={closePosterModal}>×</button>
            <img
              src={selectedPoster}
              alt="Event poster"
              className="poster-modal-image"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsPage;
