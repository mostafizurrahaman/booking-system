"use client"

import { useMemo, useState } from "react"
import {
  Car,
  CheckCircle2,
  Clock,
  Inbox,
  LogOut,
  MapPin,
  Phone,
  Route,
  Undo2,
} from "lucide-react"
import {
  acceptBooking,
  formatDuration,
  getRideEstimate,
  logoutDriver,
  releaseBooking,
  updateBookingStatus,
  useBookings,
  useDriverAuth,
  type Booking,
  type Driver,
} from "@/lib/store"
import { BookingTracking } from "@/components/booking-tracking"

export function DriverHeader({ driver }: { driver: Driver }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {driver.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{driver.name}</p>
            <p className="truncate text-xs text-muted-foreground">{driver.vehicle ?? "Kein Fahrzeug hinterlegt"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => logoutDriver()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Abmelden
        </button>
      </div>
    </header>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        {icon}
      </span>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}

function RideDetails({ b }: { b: Booking }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden="true" />
        <span className="text-foreground">{b.pickup}</span>
      </div>
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
        <span className="text-foreground">{b.destination}</span>
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {b.rideDate ? (
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden="true" />
            {b.rideDate}
            {b.rideTime ? `, ${b.rideTime} Uhr` : ""}
          </span>
        ) : null}
        <span className="flex items-center gap-1 font-medium text-foreground">
          <Route className="size-3.5" aria-hidden="true" />
          ca. {formatDuration(getRideEstimate(b).minutes)} ({getRideEstimate(b).km.toFixed(1)} km)
        </span>
        {b.transportArt ? (
          <span className="flex items-center gap-1">
            <Car className="size-3.5" aria-hidden="true" />
            {b.transportArt}
          </span>
        ) : null}
        {b.phone ? (
          <a href={`tel:${b.phone}`} className="flex items-center gap-1 hover:text-foreground">
            <Phone className="size-3.5" aria-hidden="true" />
            {b.phone}
          </a>
        ) : null}
      </div>
      {b.notes ? <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">{b.notes}</p> : null}
    </div>
  )
}

function RideCard({
  b,
  children,
  badge,
}: {
  b: Booking
  children?: React.ReactNode
  badge?: React.ReactNode
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-bold text-foreground">{b.patientName}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                b.type === "gkv" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {b.type === "gkv" ? "Kasse" : "Privat"}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{b.bookingNumber}</p>
          {b.price != null ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{b.price.toFixed(2)} € Fahrpreis</p>
          ) : null}
        </div>
        {badge}
      </div>
      <RideDetails b={b} />
      {children ? <div className="mt-4">{children}</div> : null}
    </article>
  )
}

export function DriverDashboard() {
  const { driver } = useDriverAuth()
  const bookings = useBookings()

  const { available, mine, completed } = useMemo(() => {
    const available = bookings.filter((b) => b.status === "neu" && !b.assignedDriverId)
    const mine = bookings.filter(
      (b) => b.assignedDriverId === driver?.id && b.status === "zugewiesen",
    )
    const completed = bookings.filter(
      (b) => b.assignedDriverId === driver?.id && b.status === "abgeschlossen",
    )
    return { available, mine, completed }
  }, [bookings, driver?.id])

  if (!driver) return null

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Inbox className="size-5" aria-hidden="true" />} label="Verfügbare Fahrten" value={available.length} />
        <StatCard icon={<Route className="size-5" aria-hidden="true" />} label="Meine aktiven Fahrten" value={mine.length} />
        <StatCard icon={<CheckCircle2 className="size-5" aria-hidden="true" />} label="Abgeschlossen" value={completed.length} />
      </section>

      {/* Verfügbare Fahrten */}
      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Inbox className="size-5 text-blue-600" aria-hidden="true" />
          Verfügbare Fahrten
        </h2>
        {available.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            Aktuell keine freien Fahrten verfügbar.
          </p>
        ) : (
          <div className="grid gap-4">
            {available.map((b) => (
              <RideCard key={b.id} b={b}>
                <AcceptButton bookingId={b.id} driverId={driver.id} />
              </RideCard>
            ))}
          </div>
        )}
      </section>

      {/* Meine Fahrten */}
      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Route className="size-5 text-blue-600" aria-hidden="true" />
          Meine Fahrten
        </h2>
        {mine.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
            Sie haben noch keine Fahrt übernommen.
          </p>
        ) : (
          <div className="grid gap-4">
            {mine.map((b) => (
              <RideCard
                key={b.id}
                b={b}
                badge={
                  <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    Übernommen
                  </span>
                }
              >
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateBookingStatus(b.id, "abgeschlossen")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Fahrt abschließen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Fahrt wirklich zurückgeben? Sie wird wieder freigegeben.")) {
                        releaseBooking(b.id, driver.id)
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                  >
                    <Undo2 className="size-4" aria-hidden="true" />
                    Zurückgeben
                  </button>
                </div>
                <BookingTracking booking={b} />
              </RideCard>
            ))}
          </div>
        )}
      </section>

      {/* Abgeschlossene Fahrten */}
      {completed.length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
            Abgeschlossen
          </h2>
          <div className="grid gap-4">
            {completed.map((b) => (
              <RideCard
                key={b.id}
                b={b}
                badge={
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Erledigt
                  </span>
                }
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function AcceptButton({ bookingId, driverId }: { bookingId: string; driverId: string }) {
  const [error, setError] = useState<string | null>(null)

  function handleAccept() {
    const res = acceptBooking(bookingId, driverId)
    if (!res.ok) setError(res.error ?? "Fahrt konnte nicht übernommen werden.")
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleAccept}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
      >
        <CheckCircle2 className="size-4" aria-hidden="true" />
        Fahrt annehmen
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  )
}
