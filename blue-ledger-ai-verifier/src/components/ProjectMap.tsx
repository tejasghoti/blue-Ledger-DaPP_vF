import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L, { LatLngExpression } from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { Button } from '@/components/ui/button';
import { Layers, TreePine } from 'lucide-react';

interface ProjectMapProps {
  coords: { lat: number; lng: number };
  projectName: string;
  locationName?: string;
  status?: string;
}

const customMangroveIcon = new L.Icon({
  iconUrl: iconUrl,
  iconRetinaUrl: iconRetinaUrl,
  shadowUrl: shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export function ProjectMap({ coords, projectName, locationName, status }: ProjectMapProps) {
  const position: LatLngExpression = [coords.lat || 21.9497, coords.lng || 88.9007]; // Default to Sundarbans Mangrove Delta
  const [mapType, setMapType] = useState<'osm' | 'satellite'>('satellite');

  const tileUrls = {
    osm: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
  };

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden border border-emerald-500/20 shadow-md">
      <div className="absolute top-3 right-3 z-[400]">
        <Button
          size="sm"
          variant="secondary"
          className="bg-background/90 backdrop-blur border text-xs gap-1.5 shadow"
          onClick={() => setMapType(prev => prev === 'osm' ? 'satellite' : 'osm')}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          {mapType === 'satellite' ? 'Map View' : 'Satellite Imagery'}
        </Button>
      </div>

      <MapContainer center={position} zoom={12} scrollWheelZoom={false} className="h-full w-full z-0">
        <TileLayer
          attribution={mapType === 'satellite' ? 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community' : '&copy; OpenStreetMap contributors'}
          url={tileUrls[mapType]}
        />
        <Marker position={position} icon={customMangroveIcon}>
          <Popup>
            <div className="p-1 space-y-1">
              <div className="font-bold text-sm flex items-center gap-1 text-emerald-700">
                <TreePine className="w-4 h-4" /> {projectName}
              </div>
              {locationName && <div className="text-xs text-slate-600">Location: {locationName}</div>}
              {status && (
                <div className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider">
                  Status: {status}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}