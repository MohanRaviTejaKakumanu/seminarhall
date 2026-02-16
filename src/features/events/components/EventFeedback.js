import React, { useEffect, useState, useContext } from "react";
import API from "../../../api";
import { ThemeContext } from "../../../context/ThemeContext";
import "../EventFeedback.css";

const EventFeedback = ({ eventId }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const [feedbacks, setFeedbacks] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch feedbacks for the event
  useEffect(() => {
    if (!eventId) return;

    const fetchFeedbacks = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/feedbacks/event/${eventId}`);
        const feedbackData = res.data || [];
        setFeedbacks(feedbackData);

        // Calculate average rating
        if (feedbackData.length > 0) {
          const totalRating = feedbackData.reduce(
            (sum, f) => sum + (f.rating || 0),
            0,
          );
          setAvgRating((totalRating / feedbackData.length).toFixed(1));
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching feedbacks:", err);
        setError("Could not load feedback");
      } finally {
        setLoading(false);
      }
    };

    fetchFeedbacks();
  }, [eventId]);

  if (loading) {
    return (
      <div className={`feedback-section ${isDarkMode ? "dark-mode" : ""}`}>
        ⏳ Loading feedback...
      </div>
    );
  }

  if (feedbacks.length === 0) {
    return (
      <div className={`feedback-section ${isDarkMode ? "dark-mode" : ""}`}>
        <h3>💬 Feedback</h3>
        <p>No feedback yet. Be the first to share your experience!</p>
      </div>
    );
  }

  return (
    <div className={`feedback-section ${isDarkMode ? "dark-mode" : ""}`}>
      <h3>💬 Event Feedback</h3>

      {/* Average Rating */}
      <div className="avg-rating">
        <span className="rating-number">⭐ {avgRating}</span>
        <span className="rating-count">({feedbacks.length} reviews)</span>
      </div>

      {/* Feedback List */}
      <div className="feedback-list">
        {feedbacks.map((feedback) => (
          <div key={feedback._id} className="feedback-item">
            <div className="feedback-header">
              <div className="feedback-rating">
                {"⭐".repeat(feedback.rating)}
                {"☆".repeat(5 - feedback.rating)}
              </div>
              <span className="feedback-name">
                {feedback.student?.name || "Anonymous"}
              </span>
            </div>
            <p className="feedback-comment">{feedback.comments}</p>
          </div>
        ))}
      </div>

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default EventFeedback;
