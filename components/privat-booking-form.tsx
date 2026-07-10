"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Clock, Euro, Loader2, Sparkles } from "lucide-react"
import { Field, TextInput, SectionTitle } from "@/components/form-fields"
import { createBooking, estimateRide, formatDuration, usePricing } from "@/lib/store"

type PrivatExample = {
  von: string
  nach: string
  datum: string
  zeit: string
  kontakt: string
}

const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

const privatExample: PrivatExample = {
  von: "Bahnhofplatz 3, 80335 München",
  nach: "Klinikum Großhadern, 81377 München",
  datum: inDays(3),
  zeit: "14:00",
  kontakt: "0151 23456789",
}

export function PrivatBookingForm() {
  const pricing = usePricing()
  const [distance, setDistance] = useState("")
  const [selectedSurcharges, setSelectedSurcharges] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [bookingNumber, setBookingNumber] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [example, setExample] = useState<PrivatExample | null>(null)
  const [formKey, setFormKey] = useState(0)

  function toggleSurcharge(id: string) {
    setSelectedSurcharges((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function fillExample() {
    setExample(privatExample)
    setDistance("12")
    const tragestuhl = pricing.surcharges.find((s) => s.id === "tragestuhl" || /tragestuhl/i.test(s.label))
    setSelectedSurcharges(new Set(tragestuhl ? [tragestuhl.id] : []))
    setFormKey((k) => k + 1)
  }

  const activeSurcharges = useMemo(
    () => pricing.surcharges.filter((s) => selectedSurcharges.has(s.id)),
    [pricing.surcharges, selectedSurcharges],
  )

  const surchargeTotal = useMemo(
    () => activeSurcharges.reduce((sum, s) => sum + s.amount, 0),
    [activeSurcharges],
  )

  const price = useMemo(() => {
    const km = Number.parseFloat(distance)
    if (!Number.isFinite(km) || km <= 0) return null
    return pricing.baseFare + km * pricing.perKm + surchargeTotal
  }, [distance, pricing.baseFare, pricing.perKm, surchargeTotal])

  // Geschätzte Fahrtzeit aus der eingegebenen Strecke.
  const estimate = useMemo(() => {
    const km = Number.parseFloat(distance)
    if (!Number.isFinite(km) || km <= 0) return null
    return estimateRide("", "", km)
  }, [distance])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      const surchargeNote = activeSurcharges.length
        ? ` · Zuschläge: ${activeSurcharges.map((s) => s.label).join(", ")}`
        : ""
      const res = await createBooking({
        type: "privat",
        patientName: String(fd.get("kontakt") ?? "Selbstzahler"),
        phone: String(fd.get("kontakt") ?? ""),
        transportArt: activeSurcharges.map((s) => s.label).join(", ") || undefined,
        vehicleType: "Privatfahrt",
        pickup: String(fd.get("von") ?? ""),
        destination: String(fd.get("nach") ?? ""),
        rideDate: String(fd.get("datum") ?? ""),
        rideTime: String(fd.get("zeit") ?? ""),
        price: price ?? undefined,
        notes: `Strecke: ${fd.get("km") ?? ""} km${surchargeNote}`,
        estimatedMinutes: estimate?.minutes,
        estimatedDistanceKm: estimate?.km,
      })
      if (res.ok) {
        setBookingNumber(res.bookingNumber)
        setSubmitted(true)
      } else {
        setError("Die Buchung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.")
      }
    } catch {
      setError("Die Buchung konnte nicht gespeichert werden. Bitte versuchen Sie es erneut.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-bold text-foreground">Buchung bestätigt</h2>
        {bookingNumber ? (
          <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm">
            <span className="text-muted-foreground">Ihre Buchungsnummer:</span>
            <span className="font-mono font-semibold text-foreground">{bookingNumber}</span>
          </p>
        ) : null}
        <p className="mx-auto mt-2 max-w-md text-pretty leading-relaxed text-muted-foreground">
          Ihre Fahrt ist reserviert{price ? ` — Festpreis ${price.toFixed(2)} €` : ""}. Sie erhalten eine Bestätigung
          mit allen Details. Die Zahlung erfolgt bequem beim Fahrer oder online.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          Weitere Fahrt buchen
        </button>
      </div>
    )
  }

  return (
    <form key={formKey} onSubmit={handleSubmit} className="flex flex-col gap-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={fillExample}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-600 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          Beispiel ausfüllen
        </button>
      </div>
      <section className="flex flex-col gap-4">
        <SectionTitle>Fahrtdaten</SectionTitle>
        <Field label="Abholadresse" htmlFor="von">
          <TextInput id="von" name="von" placeholder="Straße, PLZ, Ort" defaultValue={example?.von} required />
        </Field>
        <Field label="Zieladresse" htmlFor="nach">
          <TextInput id="nach" name="nach" placeholder="Straße, PLZ, Ort" defaultValue={example?.nach} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Datum" htmlFor="datum">
            <TextInput id="datum" name="datum" type="date" defaultValue={example?.datum} required />
          </Field>
          <Field label="Abholzeit" htmlFor="zeit">
            <TextInput id="zeit" name="zeit" type="time" defaultValue={example?.zeit} required />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle>Strecke & Zuschläge</SectionTitle>
        <Field label="Strecke (km)" htmlFor="km" hint="Ungefähre Entfernung für die Preisberechnung.">
          <TextInput
            id="km"
            name="km"
            type="number"
            min="1"
            step="0.5"
            placeholder="z. B. 12"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            required
          />
        </Field>

        {pricing.surcharges.length > 0 ? (
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium text-foreground">Zuschläge</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {pricing.surcharges.map((s) => {
                const checked = selectedSurcharges.has(s.id)
                return (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      checked ? "border-red-300 bg-red-50 text-red-800" : "border-input bg-background text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSurcharge(s.id)}
                        className="size-4 accent-red-600"
                      />
                      {s.label}
                    </span>
                    <span className="font-medium">+{s.amount.toFixed(2)} €</span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        ) : null}
      </section>

      <div className="rounded-lg bg-red-50 p-4">
        {price != null ? (
          <div className="mb-2 flex flex-col gap-1 text-sm text-red-800">
            <div className="flex justify-between">
              <span>Grundpreis</span>
              <span>{pricing.baseFare.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between">
              <span>
                {distance || "0"} km × {pricing.perKm.toFixed(2)} €
              </span>
              <span>{(Number.parseFloat(distance || "0") * pricing.perKm).toFixed(2)} €</span>
            </div>
            {activeSurcharges.map((s) => (
              <div key={s.id} className="flex justify-between">
                <span>{s.label}</span>
                <span>{s.amount.toFixed(2)} €</span>
              </div>
            ))}
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-red-200 pt-2">
          <div className="flex items-center gap-2 text-sm font-medium text-red-800">
            <Euro className="size-5 text-red-600" aria-hidden="true" />
            Voraussichtlicher Festpreis
          </div>
          <span className="text-xl font-bold text-red-700">{price ? `${price.toFixed(2)} €` : "—"}</span>
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-red-200 pt-2 text-sm text-red-800">
          <span className="flex items-center gap-2 font-medium">
            <Clock className="size-4 text-red-600" aria-hidden="true" />
            Geschätzte Fahrtzeit
          </span>
          <span className="font-semibold">{estimate ? formatDuration(estimate.minutes) : "—"}</span>
        </div>
      </div>

      <Field label="Kontakt für die Bestätigung" htmlFor="kontakt">
          <TextInput id="kontakt" name="kontakt" type="tel" placeholder="Telefonnummer" defaultValue={example?.kontakt} required />
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Verbindlich buchen
      </button>
    </form>
  )
}
