'use client';

import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { useMemo, useState } from 'react';

interface PropertyMapProps {
  onLocationSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

const PropertyMap: React.FC<PropertyMapProps> = ({
  onLocationSelect,
  initialLat = 51.505,
  initialLng = -0.09
}) => {
  const [markerPosition, setMarkerPosition] = useState({
    lat: initialLat,
    lng: initialLng
  });

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  });

  const center = useMemo(() => ({ lat: initialLat, lng: initialLng }), [initialLat, initialLng]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      onLocationSelect(lat, lng);
    }
  };

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div className="w-full h-[300px] rounded-xl">
      <GoogleMap
        zoom={13}
        center={center}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        onClick={handleMapClick}
        options={{
          zoomControl: true,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        }}
      >
        <Marker position={markerPosition} />
      </GoogleMap>
    </div>
  );
};

export default PropertyMap; 