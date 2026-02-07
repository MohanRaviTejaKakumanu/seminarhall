// frontend/src/components/EventDetails.js
import React, { useEffect, useState, useContext } from "react";
import API from "../api";
import { AuthContext } from "../context/AuthContext";

const EventDetails = ({ eventId }) => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!eventId) return;
    API.get(`/events/${eventId}`).then((res) => setData(res.data));
  }, [eventId]);

  const register = async () => {
    setMessage("");
    if (!user || user.role !== "student") {
      setMessage("Login as student to register");
      return;
    }
    try {
      await API.post(`/registrations/${eventId}`);
      setMessage("Registered successfully");
    } catch (err) {
      setMessage(err.response?.data?.msg || "Registration failed");
    }
  };

  if (!data) return <p>Select an event to view details</p>;
  const { event, registrationsCount } = data;

  return (
    <div className="event-details">
      <h2>{event.title}</h2>
      <p><strong>About:</strong> {event.description}</p>
      <p><strong>When:</strong> {new Date(event.date).toLocaleDateString()} | {event.startTime} - {event.endTime}</p>
      <p><strong>Where:</strong> {event.hall.name} ({event.hall.building}, {event.hall.floor})</p>
      <p><strong>Organizer:</strong> {event.organizerName} ({event.organizerContact})</p>
      <p><strong>Department:</strong> {event.department}</p>
      <p><strong>Capacity:</strong> {registrationsCount} / {event.maxRegistrations}</p>
      {user && user.role === "student" && (
        <button onClick={register}>Register</button>
      )}
      {message && <p>{message}</p>}
    </div>
  );
};

export default EventDetails;