import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const pickerIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#22d3ee"/>
              <stop offset="100%" stop-color="#0891b2"/>
            </linearGradient>
          </defs>
          <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="url(#g)"/>
          <circle cx="16" cy="15" r="6" fill="white" opacity="0.9"/>
          <circle cx="16" cy="15" r="3" fill="#0891b2"/>
        </svg>
    `),
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
});

interface MapPickerProps {
    lat: number;
    lng: number;
    onPick: (lat: number, lng: number) => void;
}

function ClickHandler({ onPick }: Pick<MapPickerProps, 'onPick'>) {
    useMapEvents({
        click: (e) => onPick(e.latlng.lat, e.latlng.lng),
    });
    return null;
}

export default function MapPicker({ lat, lng, onPick }: MapPickerProps) {
    const center: [number, number] = [lat, lng];

    return (
        <div className="h-52 rounded-xl overflow-hidden ring-1 ring-white/5">
            <MapContainer
                center={center}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
                attributionControl={false}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                />
                <ClickHandler onPick={onPick} />
                <Marker
                    key={`${lat},${lng}`}
                    position={center}
                    icon={pickerIcon}
                    draggable
                    eventHandlers={{
                        dragend: (e) => {
                            const p = (e.target as L.Marker).getLatLng();
                            onPick(p.lat, p.lng);
                        },
                    }}
                />
            </MapContainer>
        </div>
    );
}
