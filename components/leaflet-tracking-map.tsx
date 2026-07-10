"use client"

import { useEffect } from "react"
import L from "leaflet"
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type { LatLng } from "@/lib/store"

// Google-Maps-ähnliche Pin-Marker (A = Start, B = Ziel).
function makePin(bg: string, glyph: string) {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative;width:30px;height:42px;">
      <div style="position:absolute;left:50%;top:0;transform:translateX(-50%);width:30px;height:30px;border-radius:50% 50% 50% 0;background:${bg};transform-origin:center;rotate:-45deg;box-shadow:0 2px 5px rgba(0,0,0,.35);border:2px solid #fff;"></div>
      <div style="position:absolute;left:50%;top:5px;transform:translateX(-50%);color:#fff;font-size:13px;font-weight:700;font-family:system-ui,sans-serif;">${glyph}</div>
    </div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  })
}

// Fahrzeug-Marker (blauer Punkt mit Halo, wie Live-Position bei Google Maps).
const driverIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:22px;height:22px;">
    <div style="position:absolute;inset:0;border-radius:9999px;background:rgba(29,78,216,.25);"></div>
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:9999px;background:#1d4ed8;border:3px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.4);"></div>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const pickupIcon = makePin("#059669", "A")
const destIcon = makePin("#dc2626", "B")

function FitBounds({ pickup, dest }: { pickup: LatLng; dest: LatLng }) {
  const map = useMap()
  useEffect(() => {
    map.fitBounds([pickup, dest], { padding: [50, 50] })
  }, [map, pickup, dest])
  return null
}

export default function LeafletTrackingMap({
  pickup,
  dest,
  position,
}: {
  pickup: LatLng
  dest: LatLng
  position: LatLng
}) {
  return (
    <MapContainer
      center={position}
      zoom={13}
      scrollWheelZoom={false}
      style={{ height: "100%", width: "100%" }}
      aria-label="Live-Karte der Fahrt"
    >
      {/* CartoDB Voyager: Google-Maps-ähnlicher, heller Kartenstil */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <FitBounds pickup={pickup} dest={dest} />
      {/* Routen-Linie: weiße Umrandung + blaue Linie, wie Google-Maps-Route */}
      <Polyline positions={[pickup, dest]} pathOptions={{ color: "#fff", weight: 8, opacity: 0.9 }} />
      <Polyline positions={[pickup, dest]} pathOptions={{ color: "#1a73e8", weight: 5 }} />
      <Marker position={pickup} icon={pickupIcon} />
      <Marker position={dest} icon={destIcon} />
      <Marker position={position} icon={driverIcon} />
    </MapContainer>
  )
}
