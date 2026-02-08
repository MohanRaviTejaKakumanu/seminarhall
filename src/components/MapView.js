// frontend/src/components/MapView.js
import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import "./MapView.css";

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
  const [activeMarker, setActiveMarker] = useState(null);

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
            {(markers || []).map((m) => (
              <button
                key={m.id}
                type="button"
                className="map-marker pointer-events-auto"
                style={{
                  left: `${m.x}%`,
                  top: `${m.y}%`,
                  transform: "translate(-50%, -100%)",
                }}
                onClick={() => setActiveMarker(m)}
                title={m.title}
                aria-label={`Open details for ${m.title}`}
              >
                <span className="marker-dot">📍</span>
              </button>
            ))}
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

              <div className="mt-6 text-right">
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
      id: "hall-1",
      x: 28,
      y: 46,
      title: "Main Hall",
      subtitle: "Building A",
      description:
        "Main lecture hall with capacity 300. Located near the central plaza.",
    },
    {
      id: "hall-2",
      x: 55,
      y: 32,
      title: "Science Block",
      subtitle: "Building C",
      description: "Labs and classrooms for physics and chemistry.",
    },
    {
      id: "hall-3",
      x: 72,
      y: 68,
      title: "Auditorium",
      subtitle: "Building D",
      description: "Large auditorium used for events and seminars.",
    },
  ],
  imageUrl: `${process.env.PUBLIC_URL}/Campus map.png`,
};

export default MapView;
