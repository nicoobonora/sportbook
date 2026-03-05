/**
 * Mappa Leaflet con marker dei circoli sportivi.
 * Importare via next/dynamic con ssr: false.
 */
"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { ITALY_CENTER, ITALY_DEFAULT_ZOOM, type MapClub } from "@/lib/types/map"
import { Badge } from "@/components/ui/badge"

// Fix Leaflet default icon paths in Next.js
const DefaultIcon = L.divIcon({
  className: "club-marker",
  html: `<div style="background:#1D4ED8;width:28px;height:28px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
})

function getClubUrl(slug: string): string {
  if (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("127.0.0.1"))
  ) {
    return `/club/${slug}`
  }
  return `https://${slug}.prenotauncampetto.it`
}

type ClubMapProps = {
  clubs: MapClub[]
}

export function ClubMap({ clubs }: ClubMapProps) {
  return (
    <MapContainer
      center={[ITALY_CENTER.lat, ITALY_CENTER.lng]}
      zoom={ITALY_DEFAULT_ZOOM}
      className="h-full w-full"
      scrollWheelZoom
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MarkerClusterGroup
        chunkedLoading
        maxClusterRadius={50}
        showCoverageOnHover={false}
      >
        {clubs.map((club) => (
          <Marker
            key={club.id}
            position={[club.latitude, club.longitude]}
            icon={DefaultIcon}
          >
            <Popup>
              <div className="min-w-[200px] space-y-2">
                <p className="font-display text-base font-bold uppercase tracking-tight">
                  {club.name}
                </p>
                {club.city && (
                  <p className="text-xs text-muted-foreground">
                    {club.city}
                    {club.region && `, ${club.region}`}
                  </p>
                )}
                {club.sports.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {club.sports.map((sport) => (
                      <Badge key={sport} variant="secondary" className="capitalize text-[10px] px-1.5 py-0">
                        {sport}
                      </Badge>
                    ))}
                  </div>
                )}
                <a
                  href={getClubUrl(club.slug)}
                  className="mt-2 inline-block rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
                >
                  Apri circolo
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
