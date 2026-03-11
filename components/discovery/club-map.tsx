/**
 * Mappa Leaflet con marker dei circoli sportivi.
 * Importare via next/dynamic con ssr: false.
 * Marker differenziati per club claimed vs unclaimed.
 * Supporta caricamento dinamico per viewport e posizione utente.
 */
"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useMap, useMapEvents } from "react-leaflet"
import { ITALY_CENTER, ITALY_DEFAULT_ZOOM, type MapClub } from "@/lib/types/map"
import { SPORT_ICONS } from "@/lib/validations/club"
import { MapPin, Navigation, ChevronRight, AlertCircle, LocateFixed } from "lucide-react"
import { useState, useEffect, useCallback, useRef } from "react"

/** Bounding box per il viewport della mappa */
export type MapBounds = {
  swLat: number
  swLng: number
  neLat: number
  neLng: number
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
  onBoundsChange?: (bounds: MapBounds) => void
  /** Posizione iniziale dell'utente (se disponibile dalla geolocalizzazione) */
  initialCenter?: [number, number] | null
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

// User position marker (pulsing blue dot)
const UserPositionIcon = L.divIcon({
  className: "user-position-marker",
  html: `<div class="user-position-dot"><div class="user-position-pulse"></div></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const USER_ZOOM = 12

/**
 * Mostra il marker della posizione utente e il pulsante "Vicino a me".
 * La posizione viene passata dal parent (discovery-page) che la chiede prima di montare la mappa.
 */
function UserLocation({ position }: { position: [number, number] | null }) {
  const map = useMap()
  const [locating, setLocating] = useState(false)

  const flyToUser = useCallback(() => {
    if (position) {
      map.flyTo(position, USER_ZOOM, { duration: 1.2 })
      return
    }
    // Se non abbiamo la posizione, riprova
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo([pos.coords.latitude, pos.coords.longitude], USER_ZOOM, { duration: 1.2 })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    )
  }, [map, position])

  return (
    <>
      {/* User position marker */}
      {position && (
        <Marker position={position} icon={UserPositionIcon} interactive={false} />
      )}

      {/* "Vicino a me" button — positioned bottom-right, above the banner */}
      <div className="leaflet-bottom leaflet-right" style={{ pointerEvents: "auto", marginBottom: 72 }}>
        <div className="leaflet-control">
          <button
            type="button"
            onClick={flyToUser}
            className="locate-btn locate-btn--label"
            aria-label="Vicino a me"
            disabled={locating}
          >
            <LocateFixed className={`h-4 w-4 ${locating ? "animate-pulse" : ""}`} />
            <span>Vicino a me</span>
          </button>
        </div>
      </div>
    </>
  )
}

/** Emette i bounds della mappa su moveend (con debounce) */
function MapEventHandler({ onBoundsChange }: { onBoundsChange: (bounds: MapBounds) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const emitBounds = useCallback((map: L.Map) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const b = map.getBounds()
      const sw = b.getSouthWest()
      const ne = b.getNorthEast()
      // Skip degenerate bounds (single point) — accade al primo mount prima del layout
      if (Math.abs(ne.lat - sw.lat) < 0.0001 && Math.abs(ne.lng - sw.lng) < 0.0001) return
      onBoundsChange({
        swLat: sw.lat,
        swLng: sw.lng,
        neLat: ne.lat,
        neLng: ne.lng,
      })
    }, 300)
  }, [onBoundsChange])

  const map = useMapEvents({
    moveend: () => emitBounds(map),
  })

  // Emit bounds on mount — piccolo delay per dare tempo al layout
  useEffect(() => {
    const t = setTimeout(() => emitBounds(map), 100)
    return () => clearTimeout(t)
  }, [map, emitBounds])

  return null
}

export function ClubMap({ clubs, onBoundsChange, initialCenter }: ClubMapProps) {
  // Se abbiamo la posizione utente, partiamo da lì a zoom 12.
  // Altrimenti, Italia intera a zoom 6.
  const center: [number, number] = initialCenter || [ITALY_CENTER.lat, ITALY_CENTER.lng]
  const zoom = initialCenter ? USER_ZOOM : ITALY_DEFAULT_ZOOM

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="h-full w-full"
      scrollWheelZoom
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {onBoundsChange && <MapEventHandler onBoundsChange={onBoundsChange} />}
      <UserLocation position={initialCenter || null} />

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
