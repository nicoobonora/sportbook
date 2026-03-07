/**
 * Mappa Leaflet con marker dei circoli sportivi.
 * Importare via next/dynamic con ssr: false.
 * Marker differenziati per club claimed vs unclaimed.
 */
"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { ITALY_CENTER, ITALY_DEFAULT_ZOOM, type MapClub } from "@/lib/types/map"
import { MapPin, Navigation, ChevronRight, AlertCircle } from "lucide-react"

/** Sport icon mapping */
const SPORT_ICONS: Record<string, string> = {
  calcetto: "\u26BD",
  calcio: "\u26BD",
  padel: "\uD83C\uDFBE",
  tennis: "\uD83C\uDFBE",
  basket: "\uD83C\uDFC0",
  pallavolo: "\uD83C\uDFD0",
  nuoto: "\uD83C\uDFCA",
  "beach-volley": "\uD83C\uDFD0",
  "ping-pong": "\uD83C\uDFD3",
  badminton: "\uD83C\uDFF8",
  fitness: "\uD83D\uDCAA",
  crossfit: "\uD83C\uDFCB\uFE0F",
  yoga: "\uD83E\uDDD8",
  golf: "\u26F3",
  rugby: "\uD83C\uDFC9",
  atletica: "\uD83C\uDFC3",
}

// Marker icon for claimed clubs (blue)
const ClaimedIcon = L.divIcon({
  className: "club-marker",
  html: `<div class="club-marker-dot"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
})

// Marker icon for unclaimed clubs (gray, lower opacity)
const UnclaimedIcon = L.divIcon({
  className: "club-marker club-marker--unclaimed",
  html: `<div class="club-marker-dot club-marker-dot--unclaimed"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -36],
})

function getMarkerIcon(club: MapClub): L.DivIcon {
  return club.claim_status === "claimed" ? ClaimedIcon : UnclaimedIcon
}

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

function getDirectionsUrl(club: MapClub): string {
  const q = club.address
    ? encodeURIComponent(`${club.address}, ${club.city || ""}`)
    : `${club.latitude},${club.longitude}`
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`
}

type ClubMapProps = {
  clubs: MapClub[]
}

function ClubPopupContent({ club }: { club: MapClub }) {
  const coverSrc = club.cover_image_url || club.logo_url
  const sportIcons = club.sports
    .map((s) => SPORT_ICONS[s])
    .filter(Boolean)
    .slice(0, 3)
  const isUnclaimed = club.claim_status !== "claimed"

  return (
    <div className="club-popup-card">
      {/* Cover image */}
      {coverSrc ? (
        <div className="club-popup-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverSrc}
            alt={club.name}
            className="club-popup-cover-img"
            loading="lazy"
          />
          {/* Sport icons overlay */}
          {sportIcons.length > 0 && (
            <div className="club-popup-sport-overlay">
              {sportIcons.map((icon, i) => (
                <span key={i} className="club-popup-sport-icon">{icon}</span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={`club-popup-cover club-popup-cover--placeholder${isUnclaimed ? " club-popup-cover--unclaimed" : ""}`}>
          <div className="club-popup-cover-placeholder-content">
            {sportIcons.length > 0 ? (
              <span className="text-2xl">{sportIcons[0]}</span>
            ) : (
              <MapPin className="h-6 w-6 text-white/70" />
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="club-popup-body">
        {/* Header: name + unclaimed badge */}
        <h3 className="club-popup-name">{club.name}</h3>

        {isUnclaimed && (
          <div className="club-popup-unclaimed-badge">
            <AlertCircle className="h-3 w-3" />
            <span>Non ancora verificato</span>
          </div>
        )}

        {/* Tagline */}
        {club.tagline && (
          <p className="club-popup-tagline">{club.tagline}</p>
        )}

        {/* Location */}
        {(club.address || club.city) && (
          <div className="club-popup-location">
            <MapPin className="club-popup-location-icon" />
            <span>
              {club.address || club.city}
              {club.address && club.city && `, ${club.city}`}
            </span>
          </div>
        )}

        {/* Sport chips */}
        {club.sports.length > 0 && (
          <div className="club-popup-chips">
            {club.sports.map((sport) => (
              <span key={sport} className="club-popup-chip">
                {SPORT_ICONS[sport] && (
                  <span className="club-popup-chip-icon">{SPORT_ICONS[sport]}</span>
                )}
                {sport}
              </span>
            ))}
          </div>
        )}

        {/* Actions — different for claimed vs unclaimed */}
        <div className="club-popup-actions">
          {isUnclaimed ? (
            <>
              <a
                href={getDirectionsUrl(club)}
                target="_blank"
                rel="noopener noreferrer"
                className="club-popup-cta"
                style={{color: "white"}}
              >
                <Navigation className="h-4 w-4" />
                Indicazioni
              </a>
            </>
          ) : (
            <>
              <a
                href={getClubUrl(club.slug)}
                className="club-popup-cta"
                style={{color: "white"}}
              >
                Vedi circolo
                <ChevronRight className="h-4 w-4" />
              </a>
              <a
                href={getDirectionsUrl(club)}
                target="_blank"
                rel="noopener noreferrer"
                className="club-popup-secondary"
                aria-label="Indicazioni stradali"
              >
                <Navigation className="h-3.5 w-3.5" />
                Indicazioni
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  )
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
            icon={getMarkerIcon(club)}
          >
            <Popup>
              <ClubPopupContent club={club} />
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  )
}
