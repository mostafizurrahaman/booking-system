"use client"

import { useEffect } from "react"
import { APIProvider, Map, AdvancedMarker, useMap } from "@vis.gl/react-google-maps"
import type { LatLng } from "@/lib/store"

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""

function toLatLng([lat, lng]: LatLng) {
  return { lat, lng }
}

function pinStyle(bg: string) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "28px",
    height: "28px",
    borderRadius: "9999px",
    background: bg,
    color: "#fff",
    fontSize: "14px",
    fontWeight: 700,
    boxShadow: "0 1px 4px rgba(0,0,0,.4)",
    border: "2px solid #fff",
  } as const
}

// Zeichnet die gestrichelte Route und passt den Ausschnitt an.
function RouteOverlay({ pickup, dest }: { pickup: LatLng; dest: LatLng }) {
  const map = useMap()
  useEffect(() => {
    if (!map || typeof google === "undefined") return
    const line = new google.maps.Polyline({
      path: [toLatLng(pickup), toLatLng(dest)],
      geodesic: true,
      strokeOpacity: 0,
      icons: [
        {
          icon: { path: "M 0,-1 0,1", strokeOpacity: 1, strokeColor: "#1d4ed8", strokeWeight: 3, scale: 3 },
          offset: "0",
          repeat: "14px",
        },
      ],
    })
    line.setMap(map)

    const bounds = new google.maps.LatLngBounds()
    bounds.extend(toLatLng(pickup))
    bounds.extend(toLatLng(dest))
    map.fitBounds(bounds, 48)

    return () => line.setMap(null)
  }, [map, pickup, dest])
  return null
}

export default function GoogleTrackingMap({
  pickup,
  dest,
  position,
}: {
  pickup: LatLng
  dest: LatLng
  position: LatLng
}) {
  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
      <Map
        defaultCenter={toLatLng(position)}
        defaultZoom={13}
        gestureHandling="cooperative"
        disableDefaultUI={false}
        mapId="kfd-tracking"
        style={{ height: "100%", width: "100%" }}
      >
        <RouteOverlay pickup={pickup} dest={dest} />
        <AdvancedMarker position={toLatLng(pickup)}>
          <div style={pinStyle("#059669")}>A</div>
        </AdvancedMarker>
        <AdvancedMarker position={toLatLng(dest)}>
          <div style={pinStyle("#dc2626")}>B</div>
        </AdvancedMarker>
        <AdvancedMarker position={toLatLng(position)}>
          <div style={pinStyle("#1d4ed8")}>{"\u2588"}</div>
        </AdvancedMarker>
      </Map>
    </APIProvider>
  )
}
