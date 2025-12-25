import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LOCATION_COORDS } from '@/lib/leaflet-setup';

interface LocationMapProps {
  data: Array<{ location: string; count: number }>;
}

export function LocationMap({ data }: LocationMapProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground">
        No location data available
      </div>
    );
  }

  // Calculate center (between Toronto and Ottawa)
  const center: [number, number] = [44.5, -78];

  return (
    <div className="space-y-4">
      <MapContainer
        center={center}
        zoom={7}
        className="h-[300px] md:h-[350px] rounded-lg border"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {data.map(({ location, count }) => {
          const coords = LOCATION_COORDS[location];
          if (!coords) return null;

          return (
            <CircleMarker
              key={location}
              center={coords}
              radius={Math.max(8, Math.sqrt(count) * 3)}
              pathOptions={{
                fillColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary))',
                fillOpacity: 0.6,
                weight: 2
              }}
            >
              <Popup>
                <div className="font-medium">{location}</div>
                <div className="text-sm">{count} students</div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {data.map(({ location, count }) => (
          <div key={location} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>{location}: {count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
