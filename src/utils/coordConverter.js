/**
 * Convert GPS coordinates (lat, lng) to x,y percentages on the map image.
 *
 * Requires mapBounds: { minLat, maxLat, minLng, maxLng }
 * representing the GPS boundaries of the entire campus map.
 */
export const gpsToMapPercent = (lat, lng, mapBounds) => {
  if (!mapBounds) {
    console.warn("mapBounds not provided");
    return { x: 50, y: 50 };
  }

  const { minLat, maxLat, minLng, maxLng } = mapBounds;

  // Calculate percentages: (value - min) / (max - min) * 100
  const x = ((lng - minLng) / (maxLng - minLng)) * 100;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 100; // Inverted for top-down

  return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
};

export default gpsToMapPercent;
