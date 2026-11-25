import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

const civicMarkerIcon = L.divIcon({
  className: 'scms-map-pin',
  html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#0F2942;border:3px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.35);transform:rotate(-45deg);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const MapClickHandler = ({ onSelect, readOnly }) => {
  useMapEvents({
    click(e) {
      if (!readOnly && onSelect) {
        onSelect({
          lat: Number(e.latlng.lat.toFixed(6)),
          lng: Number(e.latlng.lng.toFixed(6)),
        });
      }
    },
  });
  return null;
};

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
};

const DEFAULT_CENTER = [28.6139, 77.209]; // Fallback center when user hasn't picked a spot yet

const LocationPickerMap = ({
  latitude,
  longitude,
  onLocationChange,
  readOnly = false,
  heightClass = 'h-72',
}) => {
  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !Number.isNaN(latitude) &&
    !Number.isNaN(longitude);

  const center = hasCoordinates ? [latitude, longitude] : DEFAULT_CENTER;

  return (
    <div className={`w-full ${heightClass} rounded-xl overflow-hidden border border-slate-300`}>
      <MapContainer
        center={center}
        zoom={hasCoordinates ? 15 : 12}
        scrollWheelZoom={!readOnly}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onSelect={onLocationChange} readOnly={readOnly} />
        <RecenterMap center={hasCoordinates ? [latitude, longitude] : null} />
        {hasCoordinates && <Marker position={[latitude, longitude]} icon={civicMarkerIcon} />}
      </MapContainer>
    </div>
  );
};

export default LocationPickerMap;
