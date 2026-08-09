import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import type L from 'leaflet';
import { customIcon } from './LocationMap';

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
                    icon={customIcon}
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
