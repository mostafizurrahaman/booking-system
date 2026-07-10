"use client"

import dynamic from "next/dynamic"
import type { LatLng } from "@/lib/store"

const hasGoogleKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

const mapLoading = (
  <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
    Karte wird geladen…
  </div>
)

// Google Maps wird verwendet, sobald ein API-Key hinterlegt ist – sonst die
// OpenStreetMap-Demo (funktioniert ohne Key).
const GoogleTrackingMap = dynamic(() => import("@/components/google-tracking-map"), {
  ssr: false,
  loading: () => mapLoading,
})

const LeafletTrackingMap = dynamic(() => import("@/components/leaflet-tracking-map"), {
  ssr: false,
  loading: () => mapLoading,
})

export default function LiveTrackingMap(props: { pickup: LatLng; dest: LatLng; position: LatLng }) {
  if (hasGoogleKey) return <GoogleTrackingMap {...props} />
  return <LeafletTrackingMap {...props} />
}
