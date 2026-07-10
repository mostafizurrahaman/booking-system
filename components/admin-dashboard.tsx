"use client"

import { useMemo, useState } from "react"
import {
  Car,
  Check,
  CheckCircle2,
  Copy,
  Euro,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react"
import { BookingTracking } from "@/components/booking-tracking"
import { CommissionInvoice } from "@/components/commission-invoice"
import {
  addSurcharge,
  assignDriver,
  clearFahrdienstData,
  createDriver,
  deleteDriver,
  FEE_PER_RIDE,
  formatDuration,
  generatePassword,
  getRideEstimate,
  logoutAdmin,
  removeSurcharge,
  resetPricing,
  savePricing,
  seedFahrdienstSampleData,
  setDriverActive,
  setDriverPassword,
  updateBookingStatus,
  updateSurcharge,
  useBookings,
  useDrivers,
  useDriverPasswords,
  usePricing,
  type Booking,
  type BookingStatus,
  type Driver,
} from "@/lib/store"
import { Field, TextInput } from "@/components/form-fields"

const STATUS_LABELS: Record<BookingStatus, string> = {
  neu: "Neu",
  zugewiesen: "Zugewiesen",
  abgeschlossen: "Abgeschlossen",
  storniert: "Storniert",
}

const STATUS_STYLES: Record<BookingStatus, string> = {
  neu: "bg-amber-50 text-amber-700 border-amber-200",
  zugewiesen: "bg-blue-50 text-blue-700 border-blue-200",
  abgeschlossen: "bg-emerald-50 text-emerald-700 border-emerald-200",
  storniert: "bg-muted text-muted-foreground border-border",
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Car
  label: string
  value: string
  tint: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <span className={`flex size-11 items-center justify-center rounded-xl ${tint}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const bookings = useBookings()
  const drivers = useDrivers()

  const summary = useMemo(() => {
    const billable = bookings.filter((b) => b.status !== "storniert")
    return {
      totalRides: bookings.length,
      billableRides: billable.length,
      totalFees: billable.reduce((sum, b) => sum + (b.fee ?? 0), 0),
      openRides: bookings.filter((b) => b.status === "neu").length,
    }
  }, [bookings])

  const hasData = bookings.length > 0 || drivers.length > 0

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">
          {hasData
            ? "Verwalten Sie Buchungen und Fahrer Ihres Fahrdiensts."
            : "Noch keine Daten vorhanden. Laden Sie Musterdaten, um die Funktionen auszuprobieren."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => seedFahrdienstSampleData()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Musterdaten laden
          </button>
          {hasData ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Alle Buchungen und Fahrer wirklich löschen?")) clearFahrdienstData()
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Daten zurücksetzen
            </button>
          ) : null}
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Car} label="Fahrten gesamt" value={String(summary.totalRides)} tint="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Wallet} label="Offene Fahrten" value={String(summary.openRides)} tint="bg-amber-50 text-amber-600" />
        <StatCard icon={Users} label="Aktive Fahrer" value={String(drivers.filter((d) => d.active).length)} tint="bg-blue-50 text-blue-600" />
        <StatCard
          icon={Euro}
          label="Vermittlungsprovision"
          value={`${summary.totalFees.toFixed(2)} €`}
          tint="bg-red-50 text-red-600"
        />
      </section>

      <CommissionInvoice bookings={bookings} />

      <PricingPanel />

      <DriverPanel />

      <BookingsTable bookings={bookings} />
    </div>
  )
}

function PricingPanel() {
  const pricing = usePricing()
  const [baseFare, setBaseFare] = useState(String(pricing.baseFare))
  const [perKm, setPerKm] = useState(String(pricing.perKm))
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [newLabel, setNewLabel] = useState("")
  const [newAmount, setNewAmount] = useState("")

  function handleSaveBase() {
    savePricing({
      ...pricing,
      baseFare: Number.parseFloat(baseFare) || 0,
      perKm: Number.parseFloat(perKm) || 0,
    })
    setSavedAt(Date.now())
    window.setTimeout(() => setSavedAt(null), 2000)
  }

  function handleAddSurcharge(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const amount = Number.parseFloat(newAmount)
    if (!newLabel.trim() || !Number.isFinite(amount)) return
    addSurcharge(newLabel, amount)
    setNewLabel("")
    setNewAmount("")
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <SlidersHorizontal className="size-5 text-muted-foreground" aria-hidden="true" />
          Tarife & Preise
        </h2>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Tarife auf Standardwerte zurücksetzen?")) resetPricing()
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Standard
        </button>
      </div>

      {/* Grundpreis & Kilometergeld */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Grundpreis pro Fahrt (€)" htmlFor="p-base">
          <TextInput
            id="p-base"
            type="number"
            min="0"
            step="0.5"
            value={baseFare}
            onChange={(e) => setBaseFare(e.target.value)}
          />
        </Field>
        <Field label="Kilometergeld (€/km)" htmlFor="p-km">
          <TextInput
            id="p-km"
            type="number"
            min="0"
            step="0.1"
            value={perKm}
            onChange={(e) => setPerKm(e.target.value)}
          />
        </Field>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSaveBase}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Save className="size-4" aria-hidden="true" />
          Speichern
        </button>
        {savedAt ? <span className="text-sm text-emerald-600">Gespeichert</span> : null}
      </div>

      {/* Zuschläge */}
      <div className="mt-6 border-t border-border pt-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Zuschläge (z. B. Tragestuhl)</h3>
        {pricing.surcharges.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Zuschläge definiert.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {pricing.surcharges.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 py-3">
                <input
                  value={s.label}
                  onChange={(e) => updateSurcharge(s.id, { label: e.target.value })}
                  aria-label="Bezeichnung"
                  className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={s.amount}
                    onChange={(e) => updateSurcharge(s.id, { amount: Number.parseFloat(e.target.value) || 0 })}
                    aria-label={`Betrag für ${s.label}`}
                    className="w-24 rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">€</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeSurcharge(s.id)}
                  aria-label={`Zuschlag ${s.label} löschen`}
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddSurcharge} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <label htmlFor="s-label" className="mb-1 block text-sm font-medium text-foreground">
              Neuer Zuschlag
            </label>
            <input
              id="s-label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="z. B. Treppenhilfe"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="s-amount" className="mb-1 block text-sm font-medium text-foreground">
              Betrag (€)
            </label>
            <input
              id="s-amount"
              type="number"
              min="0"
              step="0.5"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="0"
              className="w-28 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <Plus className="size-4" aria-hidden="true" />
            Hinzufügen
          </button>
        </form>
      </div>
    </section>
  )
}

function DriverPasswordControl({ driver, hasPassword }: { driver: Driver; hasPassword: boolean }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [show, setShow] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleSave() {
    setError(null)
    const res = setDriverPassword(driver.id, value.trim())
    if (!res.ok) {
      setError(res.error ?? "Fehler beim Speichern.")
      return
    }
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2000)
    setOpen(false)
    setValue("")
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setError("Kopieren nicht möglich.")
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            hasPassword ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          <KeyRound className="size-3.5" aria-hidden="true" />
          {hasPassword ? "Passwort gesetzt" : "Kein Passwort"}
        </span>
        {saved ? <span className="text-xs text-emerald-600">Gespeichert</span> : null}
        <button
          type="button"
          onClick={() => {
            setValue("")
            setError(null)
            setShow(true)
            setOpen(true)
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-input px-2.5 py-1 text-xs font-medium text-foreground transition hover:bg-muted"
        >
          <KeyRound className="size-3.5" aria-hidden="true" />
          {hasPassword ? "Passwort ändern" : "Passwort festlegen"}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`pw-${driver.id}`} className="mb-1 block text-xs font-medium text-foreground">
            Passwort für {driver.name}
          </label>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <input
                id={`pw-${driver.id}`}
                type={show ? "text" : "password"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="mind. 6 Zeichen"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-9 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Passwort verbergen" : "Passwort anzeigen"}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setValue(generatePassword())
                setShow(true)
              }}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-input px-2.5 py-2 text-xs font-medium text-foreground transition hover:bg-muted"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Generieren
            </button>
            <button
              type="button"
              onClick={handleCopy}
              disabled={!value}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-input px-2.5 py-2 text-xs font-medium text-foreground transition hover:bg-muted disabled:opacity-40"
            >
              {copied ? <Check className="size-4 text-emerald-600" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "Kopiert" : "Kopieren"}
            </button>
          </div>
        </div>
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Save className="size-4" aria-hidden="true" />
          Speichern
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            setValue("")
            setError(null)
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
        >
          Abbrechen
        </button>
      </div>
    </div>
  )
}

function DriverPanel() {
  const drivers = useDrivers()
  const passwords = useDriverPasswords()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [vehicle, setVehicle] = useState("")
  const [password, setPassword] = useState("")
  const [pwError, setPwError] = useState<string | null>(null)

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwError(null)
    if (!name.trim()) return
    const pw = password.trim()
    if (pw && pw.length < 6) {
      setPwError("Das Passwort muss mindestens 6 Zeichen lang sein.")
      return
    }
    const id = createDriver({ name: name.trim(), email: email.trim(), phone: phone.trim(), vehicle: vehicle.trim() })
    if (pw) setDriverPassword(id, pw)
    setName("")
    setEmail("")
    setPhone("")
    setVehicle("")
    setPassword("")
    setOpen(false)
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Users className="size-5 text-muted-foreground" aria-hidden="true" />
          Fahrer
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          {open ? <X className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          {open ? "Abbrechen" : "Fahrer hinzufügen"}
        </button>
      </div>

      {open ? (
        <form onSubmit={handleAdd} className="mb-6 grid gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="d-name">
            <TextInput id="d-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vorname Nachname" required />
          </Field>
          <Field label="E-Mail" htmlFor="d-email">
            <TextInput id="d-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="fahrer@beispiel.de" />
          </Field>
          <Field label="Telefon" htmlFor="d-phone">
            <TextInput id="d-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0151 ..." />
          </Field>
          <Field label="Fahrzeug" htmlFor="d-vehicle">
            <TextInput id="d-vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="z. B. VW Caddy (rollstuhlgerecht)" />
          </Field>
          <Field label="Passwort (optional)" htmlFor="d-password" hint="Leer lassen, damit der Fahrer es beim ersten Login selbst vergibt.">
            <div className="flex gap-2">
              <TextInput
                id="d-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="mind. 6 Zeichen"
              />
              <button
                type="button"
                onClick={() => setPassword(generatePassword())}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-input px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                <RefreshCw className="size-4" aria-hidden="true" />
                Generieren
              </button>
            </div>
          </Field>
          <div className="sm:col-span-2">
            {pwError ? <p className="mb-2 text-sm text-red-600">{pwError}</p> : null}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Speichern
            </button>
          </div>
        </form>
      ) : null}

      {drivers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Fahrer angelegt.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {drivers.map((d) => (
            <li key={d.id} className="flex flex-col gap-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-foreground">{d.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {[d.vehicle, d.phone, d.email].filter(Boolean).join(" · ") || "Keine weiteren Angaben"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDriverActive(d.id, !d.active)}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      d.active
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-border bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {d.active ? "Aktiv" : "Inaktiv"}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDriver(d.id)}
                    aria-label={`Fahrer ${d.name} löschen`}
                    className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <DriverPasswordControl driver={d} hasPassword={d.id in passwords} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function BookingsTable({ bookings }: { bookings: Booking[] }) {
  const drivers = useDrivers()

  if (bookings.length === 0) {
    return (
      <section className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
        <Car className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
        <p className="mt-3 text-sm text-muted-foreground">Noch keine Buchungen vorhanden.</p>
      </section>
    )
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <h2 className="border-b border-border px-6 py-4 text-base font-bold text-foreground">Buchungen</h2>
      <div className="flex flex-col divide-y divide-border">
        {bookings.map((b) => (
          <BookingRow key={b.id} booking={b} drivers={drivers} />
        ))}
      </div>
    </section>
  )
}

function BookingRow({ booking: b, drivers }: { booking: Booking; drivers: ReturnType<typeof useDrivers> }) {
  const fmtPrice = b.price != null ? `${b.price.toFixed(2)} €` : null
  const [showTracking, setShowTracking] = useState(false)
  const canTrack = b.assignedDriverId != null || b.status === "abgeschlossen"

  return (
    <div className="flex flex-col gap-3 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${
              b.type === "gkv" ? "border-emerald-200 text-emerald-700" : "border-red-200 text-red-700"
            }`}
          >
            {b.type === "gkv" ? "GKV" : "Privat"}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
            {STATUS_LABELS[b.status]}
          </span>
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">
            {b.bookingNumber}
          </span>
          <p className="font-semibold text-foreground">{b.patientName}</p>
        </div>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {b.pickup} → {b.destination}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {[b.rideDate, b.rideTime].filter(Boolean).join(" · ")}
          {b.insurance ? ` · ${b.insurance}` : ""}
          {b.transportArt ? ` · ${b.transportArt}` : ""}
          {b.vehicleType ? ` · ${b.vehicleType}` : ""}
          {` · ca. ${formatDuration(getRideEstimate(b).minutes)} Fahrt`}
          {fmtPrice ? ` · ${fmtPrice}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`driver-${b.id}`}>
          Fahrer zuweisen
        </label>
        <select
          id={`driver-${b.id}`}
          value={b.assignedDriverId ?? ""}
          onChange={(e) => assignDriver(b.id, e.target.value || null)}
          className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">— Fahrer —</option>
          {drivers
            .filter((d) => d.active)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>

        {b.status !== "abgeschlossen" && b.status !== "storniert" ? (
          <button
            type="button"
            onClick={() => updateBookingStatus(b.id, "abgeschlossen")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Abschließen
          </button>
        ) : null}

        {b.status !== "storniert" ? (
          <button
            type="button"
            onClick={() => updateBookingStatus(b.id, "storniert")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          >
            <X className="size-4" aria-hidden="true" />
            Stornieren
          </button>
        ) : (
          <button
            type="button"
            onClick={() => updateBookingStatus(b.id, "neu")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          >
            Reaktivieren
          </button>
        )}

        {canTrack ? (
          <button
            type="button"
            onClick={() => setShowTracking((v) => !v)}
            aria-expanded={showTracking}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              showTracking
                ? "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
                : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            <MapPin className="size-4" aria-hidden="true" />
            Live-Tracking
          </button>
        ) : null}
      </div>
      </div>

      {showTracking ? <BookingTracking booking={b} /> : null}
    </div>
  )
}

export function DashboardHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-4 sm:px-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Krankenfahrdienst Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Vermittlungsprovision: {FEE_PER_RIDE.toFixed(2)} € pro Fahrt
        </p>
      </div>
      <button
        type="button"
        onClick={() => logoutAdmin()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Abmelden
      </button>
    </header>
  )
}
