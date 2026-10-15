import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { ClubSummary, Coords } from "@/types/club";
import {
  createPriceIcon,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  TILE_ATTRIBUTION,
  TILE_URL,
} from "@/lib/map";

interface ClubsMapProps {
  clubs: ClubSummary[];
  selectedId: string | null;
  flyTarget: Coords | null;
  userPosition: Coords | null;
  onSelect: (clubId: string) => void;
  onMapClick: () => void;
}

function FlyController({ target }: { target: Coords | null }) {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 14), {
        duration: 0.6,
      });
    }
  }, [map, target]);

  return null;
}

function ClickController({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick });
  return null;
}

export function ClubsMap({
  clubs,
  selectedId,
  flyTarget,
  userPosition,
  onSelect,
  onMapClick,
}: ClubsMapProps) {
  return (
    <MapContainer
      center={[DEFAULT_CENTER.lat, DEFAULT_CENTER.lng]}
      zoom={DEFAULT_ZOOM}
      className="h-full w-full"
    >
      <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} />
      <FlyController target={flyTarget} />
      <ClickController onClick={onMapClick} />

      {userPosition && (
        <CircleMarker
          center={[userPosition.lat, userPosition.lng]}
          radius={8}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: "#38bdf8",
            fillOpacity: 1,
          }}
        />
      )}

      {clubs.map((club) => {
        const active = club.id === selectedId;
        return (
          <Marker
            key={club.id}
            position={[club.coords.lat, club.coords.lng]}
            icon={createPriceIcon(
              club.minPricePerHour,
              active,
              club.seatsFree === 0,
            )}
            zIndexOffset={active ? 1000 : 0}
            eventHandlers={{ click: () => onSelect(club.id) }}
          />
        );
      })}
    </MapContainer>
  );
}
