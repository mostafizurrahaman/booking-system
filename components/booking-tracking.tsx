"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"
import { useState } from "react"
import { CheckCircle2, Clock, MapPin, Pause, Play, RotateCcw } from "lucide-react"
import {
  advanceTracking,
  formatDuration,
  getBookingRoute,
  getRideEstimate,
  getTracking,
  pauseTracking,
  resetTracking,
  startTracking,
  useTracking,
  type Booking,
} from "@/lib/store"

const LiveTrackingMap = dynamic(() => import("@/components/live-tracking-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center bg-muted text-sm text-muted-foreground">
      Karte wird geladen…
    </div>
  ),
})

const SPEEDS = [
  { label: "Langsam", step: 0.03 },
  { label: "Normal", step: 0.07 },
  { label: "Schnell", step: 0.15 },
]

export function BookingTracking({ booking }: { booking: Booking }) {
  const tracking = useTracking(booking.id)
  const [speedIndex, setSpeedIndex] = useState(1)
  const route = getBookingRoute(booking)
  const completed = booking.status === "abgeschlossen"
  const running = tracking?.running ?? false
  const progress = completed ? 1 : tracking?.progress ?? 0
  const position = tracking?.position ?? route.pickup
  const step = SPEEDS[speedIndex].step
  const estimate = getRideEstimate(booking)
  const remainingMinutes = Math.max(0, Math.round(estimate.minutes * (1 - progress)))

  // Simuliert die Fahrt: erhöht den Fortschritt, solange "running" aktiv ist.
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      const cur = getTracking(booking.id)
      if (!cur) return
      advanceTracking(booking, cur.progress + step)
    }, 800)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, step, booking.id])

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border bg-background">
      <div className="h-64 w-full">
        <LiveTrackingMap pickup={route.pickup} dest={route.dest} position={position} />
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* Fortschrittsbalken */}
        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5 text-emerald-600" aria-hidden="true" />
              {booking.pickup}
            </span>
            <span className="flex items-center gap-1">
              {booking.destination}
              <MapPin className="size-3.5 text-red-600" aria-hidden="true" />
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all duration-500 ${completed ? "bg-emerald-600" : "bg-blue-600"}`}
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span>{Math.round(progress * 100)} % zurückgelegt</span>
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" />
              {completed
                ? `Gesamtfahrtzeit ca. ${formatDuration(estimate.minutes)}`
                : `noch ca. ${formatDuration(remainingMinutes)}`}
            </span>
          </div>
        </div>

        {completed ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Ziel erreicht – Fahrt automatisch abgeschlossen.
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {running ? (
              <button
                type="button"
                onClick={() => pauseTracking(booking.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                <Pause className="size-4" aria-hidden="true" />
                Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startTracking(booking)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                <Play className="size-4" aria-hidden="true" />
                {progress > 0 ? "Fortsetzen" : "Tracking starten"}
              </button>
            )}

            {progress > 0 ? (
              <button
                type="button"
                onClick={() => resetTracking(booking.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Zurücksetzen
              </button>
            ) : null}

            <div className="ml-auto flex items-center gap-2">
              <label htmlFor={`speed-${booking.id}`} className="text-xs text-muted-foreground">
                Tempo
              </label>
              <select
                id={`speed-${booking.id}`}
                value={speedIndex}
                onChange={(e) => setSpeedIndex(Number(e.target.value))}
                className="rounded-lg border border-input bg-background px-2 py-1 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SPEEDS.map((s, i) => (
                  <option key={s.label} value={i}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
