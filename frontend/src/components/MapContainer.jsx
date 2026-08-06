import MapLibreContainer from './MapLibreContainer';

export default function MapContainer({
  donors = [],
  requests = [],
  center = { lat: 12.9716, lng: 77.5946 },
  zoom = 12,
  routeStart = null,
  routeEnd = null,
  height = '400px',
  className = ''
}) {
  return (
    <MapLibreContainer
      donors={donors}
      requests={requests}
      center={center}
      zoom={zoom}
      routeStart={routeStart}
      routeEnd={routeEnd}
      height={height}
      className={className}
    />
  );
}
