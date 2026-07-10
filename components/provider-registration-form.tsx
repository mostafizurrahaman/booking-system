"use client"

import type React from "react"
import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Field, TextInput, SectionTitle } from "@/components/form-fields"
import { registerProvider } from "@/lib/store"

export function ProviderRegistrationForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [company, setCompany] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [city, setCity] = useState("")
  const [serviceArea, setServiceArea] = useState("")
  const [fleetSize, setFleetSize] = useState("")
  const [notes, setNotes] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!company.trim() || !contactName.trim() || !email.trim()) return
    setLoading(true)
    registerProvider({
      company,
      contactName,
      email,
      phone,
      city,
      serviceArea,
      fleetSize: fleetSize ? Number(fleetSize) : undefined,
      notes,
    })
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-7" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-bold text-foreground">Registrierung eingegangen</h2>
        <p className="mx-auto mt-2 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
          Vielen Dank, {contactName}. Ihre Anmeldung für {company} wurde übermittelt und wird vom Betreiber geprüft.
          Sie werden nach der Freigabe benachrichtigt.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <div className="flex flex-col gap-4">
        <SectionTitle>Unternehmen</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Firmenname" htmlFor="p-company">
            <TextInput
              id="p-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="z. B. Mobil Krankenfahrten GmbH"
              required
            />
          </Field>
          <Field label="Stadt / Sitz" htmlFor="p-city">
            <TextInput id="p-city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="z. B. München" />
          </Field>
          <Field label="Einsatzgebiet" htmlFor="p-area" hint="Region oder Umkreis, den Sie bedienen">
            <TextInput
              id="p-area"
              value={serviceArea}
              onChange={(e) => setServiceArea(e.target.value)}
              placeholder="z. B. Großraum München, 50 km"
            />
          </Field>
          <Field label="Fahrzeuge in der Flotte" htmlFor="p-fleet">
            <TextInput
              id="p-fleet"
              type="number"
              min={0}
              value={fleetSize}
              onChange={(e) => setFleetSize(e.target.value)}
              placeholder="z. B. 5"
            />
          </Field>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <SectionTitle>Ansprechpartner</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="p-contact">
            <TextInput
              id="p-contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Vorname Nachname"
              required
            />
          </Field>
          <Field label="E-Mail" htmlFor="p-email">
            <TextInput
              id="p-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kontakt@firma.de"
              required
            />
          </Field>
          <Field label="Telefon" htmlFor="p-phone">
            <TextInput
              id="p-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="089 ..."
            />
          </Field>
        </div>
      </div>

      <Field label="Anmerkungen (optional)" htmlFor="p-notes">
        <textarea
          id="p-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Besondere Ausstattung, Rollstuhltransport, Tragestuhl, etc."
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm outline-none transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Registrierung absenden
      </button>
    </form>
  )
}
