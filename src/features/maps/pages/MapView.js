// frontend/src/features/maps/pages/MapView.js
import React, { useState, useEffect } from "react";
import API from "../../../api";
import PropTypes from "prop-types";
import "../MapView.css";

/**
 * MapView
 * Frontend-only interactive campus map component.
 * - Uses a static image as the map background (no external map libs)
 * - Places markers using absolute positioning with x/y percentage coords
 * - Clicking a marker displays lab details in a modal
 * - Responsive and reusable
 * - Uses Tailwind classes; includes fallback CSS in MapView.css
 */
const MapView = ({
  imageUrl = `${process.env.PUBLIC_URL}/Campus map.png`,
  markers = [],
}) => {
  const [hallMarkers, setHallMarkers] = useState(markers);
  const [activeMarker, setActiveMarker] = useState(null);
  const [eventsByDate, setEventsByDate] = useState({});
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState(null);

  // Fetch halls from backend on mount
  useEffect(() => {
    if (markers.length) return;
    API.get("/halls")
      .then((res) => {
        const converted = (res.data || []).map((hall) => ({
          id: hall._id || hall.id,
          hallId: hall._id || hall.id,
          x: hall.x || 50,
          y: hall.y || 50,
          title: hall.name || hall.title,
          subtitle: hall.location || "Seminar Hall",
          description: hall.description || "",
        }));
        setHallMarkers(converted);
      })
      .catch((err) => {
        console.error("Failed to load halls:", err);
        setHallMarkers([]);
      });
  }, [markers]);

  // open marker and load events for that hall
  const openMarker = (m) => {
    setActiveMarker(m);
    setEventsByDate({});
    setEventsError(null);

    const hallId = m.hallId || m.id;
    if (!hallId) return;

    setLoadingEvents(true);
    API.get("/events", { params: { hallId } })
      .then((res) => {
        const grouped = {};
        (res.data || []).forEach((ev) => {
          const d = new Date(ev.date).toDateString();
          if (!grouped[d]) grouped[d] = [];
          grouped[d].push(ev);
        });
        setEventsByDate(grouped);
      })
      .catch((err) => {
        setEventsError("Failed to load events.");
      })
      .finally(() => setLoadingEvents(false));
  };

  // Handler for Get Directions
  const getDirections = (marker) => {
    if (!marker || !marker.title) return;
    let url = null;
    // Map hall names to coordinates
    if (/seminar hall a/i.test(marker.title)) {
      url =
        "https://www.google.com/maps/search/?api=1&query=16.24785544,80.43105981";
    } else if (/seminar hall b/i.test(marker.title)) {
      url =
        "https://www.google.com/maps/search/?api=1&query=16.24782066,80.43110418";
    } else if (/seminar hall c/i.test(marker.title)) {
      url =
        "https://www.google.com/maps/search/?api=1&query=16.24808629,80.43100546";
    }
    if (url) {
      window.open(url, "_blank");
    } else {
      alert("Directions are only available for Seminar Hall A, B, and C.");
    }
  };

  // Close modal on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setActiveMarker(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="mapview-root px-4 py-6">
      <div className="mapview-wrapper max-w-6xl mx-auto">
        {/* Map area */}
        <div className="relative mapview-box">
          <img
            src={encodeURI(imageUrl)}
            alt="Campus map"
            className="mapview-image w-full h-auto block rounded-lg shadow"
            draggable={false}
          />

          {/* Overlay for markers */}
          <div className="absolute inset-0 pointer-events-none">
            {(hallMarkers || []).map((m) => (
              <button
                key={m.id}
                type="button"
                className="map-marker pointer-events-auto"
                style={{
                  left: `${m.x}%`,
                  top: `${m.y}%`,
                  transform: "translate(-50%, -100%)",
                }}
                onClick={() => openMarker(m)}
                title={m.title}
                aria-label={`Open details for ${m.title}`}
              >
                <span className="marker-dot">📍</span>
              </button>
            ))}
          </div>
        </div>

        {/* Map Legend */}
        <div className="map-legend mt-6 bg-white rounded-lg shadow-md p-4">
          <h4 className="text-lg font-semibold mb-3">📍 Map Legend</h4>
          <div className="legend-items">
            <div className="legend-item">
              <span className="legend-icon">📍</span>
              <a
                href="https://www.youtube.com/results?search_query=seminar+halls+college"
                target="_blank"
                rel="noopener noreferrer"
                className="legend-link"
              >
                Seminar Halls
              </a>
            </div>
            <div className="legend-item">
              <span className="legend-icon">🎓</span>
              <a
                href="https://www.youtube.com/results?search_query=college+events+tutorial"
                target="_blank"
                rel="noopener noreferrer"
                className="legend-link"
              >
                Events
              </a>
            </div>
            <div className="legend-item">
              <span className="legend-icon">📍</span>
              <a
                href="https://www.youtube.com/results?search_query=campus+navigation+guide"
                target="_blank"
                rel="noopener noreferrer"
                className="legend-link"
              >
                Campus Navigation
              </a>
            </div>
          </div>
        </div>

        {/* Modal */}
        {activeMarker && (
          <div
            className="map-modal fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setActiveMarker(null)}
          >
            <div
              className="map-modal-card bg-white rounded-lg shadow-lg max-w-lg w-full p-6"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">
                    {activeMarker.title}
                  </h3>
                  {activeMarker.subtitle && (
                    <p className="text-sm text-gray-600">
                      {activeMarker.subtitle}
                    </p>
                  )}
                </div>
                <button
                  aria-label="Close"
                  className="text-gray-500 hover:text-gray-800"
                  onClick={() => setActiveMarker(null)}
                >
                  ✕
                </button>
              </div>

              {activeMarker.description && (
                <p className="mt-4 text-sm text-gray-700">
                  {activeMarker.description}
                </p>
              )}

              <div className="mt-4">
                <h4 className="font-semibold">Events</h4>
                {loadingEvents && <p className="text-sm">Loading events…</p>}
                {eventsError && (
                  <p className="text-sm text-red-600">{eventsError}</p>
                )}
                {!loadingEvents &&
                  !eventsError &&
                  Object.keys(eventsByDate).length === 0 && (
                    <p className="text-sm text-gray-600">
                      No upcoming events for this hall.
                    </p>
                  )}

                {!loadingEvents &&
                  Object.entries(eventsByDate).map(([date, events]) => (
                    <div key={date} className="mt-2">
                      <div className="text-sm font-medium">{date}</div>
                      <ul className="list-disc list-inside text-sm">
                        {events.map((ev) => (
                          <li key={ev._id || ev.id}>
                            {ev.title} ({ev.startTime || ev.time || "—"} -{" "}
                            {ev.endTime || "—"})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>

              <div className="mt-6 text-right">
                <button
                  className="btn-get-directions bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 mr-2"
                  onClick={() => getDirections(activeMarker)}
                >
                  Get Directions
                </button>
                <button
                  className="btn-close bg-gray-100 px-3 py-1 rounded hover:bg-gray-200"
                  onClick={() => setActiveMarker(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

MapView.propTypes = {
  imageUrl: PropTypes.string,
  markers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      x: PropTypes.number.isRequired,
      y: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      subtitle: PropTypes.string,
      description: PropTypes.string,
    }),
  ),
};

MapView.defaultProps = {
  markers: [
    {
      id: "newton-hall",
      hallId: "newton-hall",
      x: 15,
      y: 20,
      title: "Newton Hall",
      subtitle: "Seminar Hall",
      description: "Newton Hall\n16.24765111, 80.4310964 | Alt: 33.17 m",
    },
    {
      id: "cv-raman-hall",
      hallId: "cv-raman-hall",
      x: 40,
      y: 45,
      title: "CV Raman Hall",
      subtitle: "Seminar Hall",
      description: "CV Raman Hall\n16.24773746, 80.43097479 | Alt: 33.05 m",
    },
    {
      id: "abdul-kalam-hall",
      hallId: "abdul-kalam-hall",
      x: 65,
      y: 42,
      title: "Abdul Kalam Hall",
      subtitle: "Seminar Hall",
      description: "Abdul Kalam Hall\n16.24772907, 80.4313729 | Alt: 33.45 m",
    },
  ],
  imageUrl: `${process.env.PUBLIC_URL}/Campus map.png`,
};

export default MapView;
