import React, { useEffect, useRef, useState } from "react";

export default function SelectLocationMap({
  center = { lat: 20.5937, lng: 78.9629 },
  zoom = 5,
  onChange,
}) {
  const mapRef = useRef(null);
  const inputRef = useRef(null);
  const markerRef = useRef(null);

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => setLoaded(true);
    script.onerror = () => setError("Failed to load Google Maps");

    window.gm_authFailure = () => setError("Google Maps authentication failed");

    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!loaded || error) return;

    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom,
    });

    const searchBox = new window.google.maps.places.SearchBox(inputRef.current);

    const listeners = [];

    listeners.push(
      map.addListener("click", (e) => {
        setMarker(e.latLng, "Selected location");
      }),
    );

    listeners.push(
      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places.length) return;
        const place = places[0];
        const loc = place.geometry.location;
        map.panTo(loc);
        map.setZoom(15);
        setMarker(loc, place.formatted_address || place.name);
      }),
    );

    function setMarker(location, name) {
      if (markerRef.current) markerRef.current.setMap(null);
      markerRef.current = new window.google.maps.Marker({
        map,
        position: location,
      });

      onChange?.({
        lat: typeof location.lat === "function" ? location.lat() : location.lat,
        lng: typeof location.lng === "function" ? location.lng() : location.lng,
        name,
      });
    }

    return () => {
      // remove listeners
      listeners.forEach((l) => {
        try {
          window.google.maps.event.removeListener(l);
        } catch (e) {
          // ignore
        }
      });
      // remove marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
  }, [loaded, error, center, zoom, onChange]);

  if (error) {
    return <div style={{ color: "red" }}>{error}</div>;
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="text"
        placeholder="Search location"
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "10px",
          fontSize: "16px",
          border: "1px solid #ccc",
          borderRadius: "4px",
        }}
      />
      <div
        ref={mapRef}
        style={{ width: "100%", height: "400px", borderRadius: "8px" }}
      />
    </div>
  );
}
