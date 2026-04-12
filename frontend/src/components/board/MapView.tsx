import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { MapPin } from 'lucide-react';
import type { Board, Item } from '@/types';
import 'leaflet/dist/leaflet.css';

interface LocationValue {
  address: string;
  lat: number;
  lng: number;
}

interface MapViewProps {
  board: Board;
  items: Item[];
}

export function MapView({ board, items }: MapViewProps) {
  // Find location column(s)
  const locationColumns = useMemo(
    () => (board.columns || []).filter((c) => c.columnType === 'location'),
    [board.columns]
  );

  // Extract items with valid location data
  const itemsWithLocations = useMemo(() => {
    if (locationColumns.length === 0) return [];
    const locationColumnIds = new Set(locationColumns.map((c) => c.id));

    return items
      .map((item) => {
        const locCV = (item.columnValues || []).find(
          (cv) => locationColumnIds.has(cv.columnId) && cv.value && typeof cv.value === 'object'
        );
        if (!locCV) return null;

        const loc = locCV.value as LocationValue;
        if (typeof loc.lat !== 'number' || typeof loc.lng !== 'number') return null;

        return { item, location: loc };
      })
      .filter(Boolean) as { item: Item; location: LocationValue }[];
  }, [items, locationColumns]);

  // No location column → setup prompt
  if (locationColumns.length === 0) {
    return (
      <div data-testid="map-no-location" className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <MapPin size={40} className="mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">Add a Location column to use Map view</p>
          <p className="text-sm mt-1 text-gray-400">
            Right-click the table header and add a column with type "Location"
          </p>
        </div>
      </div>
    );
  }

  // Compute map center from items or default to world center
  const center: [number, number] = useMemo(() => {
    if (itemsWithLocations.length === 0) return [40, -74]; // default NYC-ish
    const avgLat = itemsWithLocations.reduce((sum, i) => sum + i.location.lat, 0) / itemsWithLocations.length;
    const avgLng = itemsWithLocations.reduce((sum, i) => sum + i.location.lng, 0) / itemsWithLocations.length;
    return [avgLat, avgLng];
  }, [itemsWithLocations]);

  return (
    <div className="h-[500px] rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={itemsWithLocations.length <= 1 ? 12 : 4}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {itemsWithLocations.map(({ item, location }) => (
          <Marker key={item.id} position={[location.lat, location.lng]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{item.name}</p>
                <p className="text-gray-500 text-xs mt-1">{location.address}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
