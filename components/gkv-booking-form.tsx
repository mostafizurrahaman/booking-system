"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Car, Armchair, Accessibility, Clock, Loader2, Sparkles } from "lucide-react"
import { Field, TextInput, SelectInput, SectionTitle } from "@/components/form-fields"
import { createBooking, estimateRide, formatDuration } from "@/lib/store"

const transportArten = [
  { value: "Taxi / Mietwagen", label: "Taxi / Mietwagen", desc: "Sitzende Beförderung", icon: Car },
  { value: "Tragestuhl", label: "Tragestuhl", desc: "Treppengängig", icon: Armchair },
  { value: "Rollstuhl (liegend/sitzend)", label: "Rollstuhl", desc: "Liegend oder sitzend", icon: Accessibility },
]

type GkvExample = {
  name: string
  kasse: string
  versnr: string
  grund: string
  art: string
  schein: string
  von: string
  nach: string
  datum: string
  zeit: string
}

const inDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10)

const gkvExample: GkvExample = {
  name: "Helga Schmidt",
  kasse: "AOK Bayern",
  versnr: "A123456789",
  grund: "Dialysefahrt",
  art: "Rollstuhl (liegend/sitzend)",
  schein: "Ja, liegt vor",
  von: "Lindenstraße 12, 80331 München",
  nach: "Dialysezentrum Mitte, 80335 München",
  datum: inDays(2),
  zeit: "08:30",
}

export function GkvBookingForm() {
  const [submitted, setSubmitted] = useState(false)
  const [bookingNumber, setBookingNumber] = useState<string | null>(null)
  const [transportArt, setTransportArt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [example, setExample] = useState<GkvExample | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [von, setVon] = useState("")
  const [nach, setNach] = useState("")

  // Live-Schätzung der Fahrtzeit, sobald Abhol- und Zieladresse vorhanden sind.
  const estimate = useMemo(() => {
    if (von.trim().length < 3 || nach.trim().length < 3) return null
    return estimateRide(von, nach)
  }, [von, nach])

  function fillExample() {
    setExample(gkvExample)
    setTransportArt(gkvExample.art)
    setVon(gkvExample.von)
    setNach(gkvExample.nach)
    setFormKey((k) => k + 1)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await createBooking({
        type: "gkv",
        patientName: String(fd.get("name") ?? ""),
        insurance: String(fd.get("kasse") ?? ""),
        verordnungsgrund: String(fd.get("grund") ?? ""),
        transportArt: String(fd.get("art") ?? ""),
        pickup: String(fd.get("von") ?? ""),
        destination: String(fd.get("nach") ?? ""),
        rideDate: String(fd.get("datum") ?? ""),
        rideTime: String(fd.get("zeit") ?? ""),
        notes: `Versichertennr.: ${fd.get("versnr") ?? ""} · Transportschein: ${fd.get("schein") ?? ""}`,
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
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-bold text-foreground">Buchung übermittelt</h2>
        {bookingNumber ? (
          <p className="mx-auto mt-3 inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-1.5 text-sm">
            <span className="text-muted-foreground">Ihre Buchungsnummer:</span>
            <span className="font-mono font-semibold text-foreground">{bookingNumber}</span>
          </p>
        ) : null}
        <p className="mx-auto mt-2 max-w-md text-pretty leading-relaxed text-muted-foreground">
          Wir prüfen die Genehmigung mit Ihrer Krankenkasse und melden uns zur Bestätigung des Termins. Den Eigenanteil
          (i. d. R. 5–10 €) zahlen Sie direkt beim Fahrer.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-6 inline-flex items-center justify-center rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          Weitere Fahrt anlegen
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
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          Beispiel ausfüllen
        </button>
      </div>
      <section className="flex flex-col gap-4">
        <SectionTitle>Versicherte Person</SectionTitle>
        <Field label="Vor- und Nachname" htmlFor="name">
          <TextInput id="name" name="name" placeholder="Max Mustermann" defaultValue={example?.name} required />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Krankenkasse" htmlFor="kasse">
            <TextInput id="kasse" name="kasse" placeholder="z. B. AOK" defaultValue={example?.kasse} required />
          </Field>
          <Field label="Versichertennummer" htmlFor="versnr">
            <TextInput id="versnr" name="versnr" placeholder="A123456789" defaultValue={example?.versnr} required />
          </Field>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle>Transportschein (Muster 4)</SectionTitle>
        <Field label="Verordnungsgrund" htmlFor="grund">
          <SelectInput id="grund" name="grund" defaultValue={example?.grund ?? ""} required>
            <option value="" disabled>
              Bitte wählen
            </option>
            <option>Dialysefahrt</option>
            <option>Onkologische Behandlung</option>
            <option>Strahlentherapie</option>
            <option>Anderer Dauerbehandlungsgrund</option>
            <option>Einzelfahrt (genehmigungspflichtig)</option>
          </SelectInput>
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium text-foreground">Transportart</legend>
          <input type="hidden" name="art" value={transportArt} required />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {transportArten.map(({ value, label, desc, icon: Icon }) => {
              const active = transportArt === value
              return (
                <button
                  type="button"
                  key={value}
                  onClick={() => setTransportArt(value)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                    active
                      ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                      : "border-border bg-card hover:border-emerald-300 hover:bg-muted"
                  }`}
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-lg ${
                      active ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className="text-xs leading-tight text-muted-foreground">{desc}</span>
                </button>
              )
            })}
          </div>
        </fieldset>
        <Field
          label="Transportschein liegt vor?"
          htmlFor="schein"
          hint="Der Schein muss vor der Fahrt ärztlich ausgestellt sein."
        >
          <SelectInput id="schein" name="schein" defaultValue={example?.schein ?? ""} required>
            <option value="" disabled>
              Bitte wählen
            </option>
            <option>Ja, liegt vor</option>
            <option>Folgt per Upload / vor Ort</option>
          </SelectInput>
        </Field>
      </section>

      <section className="flex flex-col gap-4">
        <SectionTitle>Fahrt</SectionTitle>
        <Field label="Abholadresse" htmlFor="von">
          <TextInput
            id="von"
            name="von"
            placeholder="Straße, PLZ, Ort"
            defaultValue={example?.von}
            onChange={(e) => setVon(e.target.value)}
            required
          />
        </Field>
        <Field label="Zieladresse (Behandlungsort)" htmlFor="nach">
          <TextInput
            id="nach"
            name="nach"
            placeholder="Praxis / Klinik, PLZ, Ort"
            defaultValue={example?.nach}
            onChange={(e) => setNach(e.target.value)}
            required
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Datum" htmlFor="datum">
            <TextInput id="datum" name="datum" type="date" defaultValue={example?.datum} required />
          </Field>
          <Field label="Abholzeit" htmlFor="zeit">
            <TextInput id="zeit" name="zeit" type="time" defaultValue={example?.zeit} required />
          </Field>
        </div>
        {estimate ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm">
            <span className="flex items-center gap-2 font-medium text-emerald-800">
              <Clock className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
              Geschätzte Fahrtzeit
            </span>
            <span className="text-right text-emerald-800">
              <span className="text-base font-bold">{formatDuration(estimate.minutes)}</span>
              <span className="ml-1 text-xs text-emerald-700">≈ {estimate.km.toFixed(1)} km</span>
            </span>
          </div>
        ) : null}
      </section>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Krankenfahrt buchen
      </button>
    </form>
  )
}
