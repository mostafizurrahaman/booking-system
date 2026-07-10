"use client"

import { useMemo, useState } from "react"
import {
  Ban,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Euro,
  LogOut,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Wallet,
  X,
} from "lucide-react"
import {
  clearPlatformData,
  createPayment,
  deletePayment,
  deleteProvider,
  seedSampleData,
  setPaymentStatus,
  setProviderStatus,
  usePayments,
  useProviders,
  type Payment,
  type PaymentStatus,
  type Provider,
  type ProviderStatus,
} from "@/lib/store"
import { logoutPlatformAdmin } from "@/lib/store"
import { Field, TextInput } from "@/components/form-fields"

const PROVIDER_STATUS_LABELS: Record<ProviderStatus, string> = {
  ausstehend: "Ausstehend",
  freigegeben: "Freigegeben",
  abgelehnt: "Abgelehnt",
  gesperrt: "Gesperrt",
}

const PROVIDER_STATUS_STYLES: Record<ProviderStatus, string> = {
  ausstehend: "bg-amber-50 text-amber-700 border-amber-200",
  freigegeben: "bg-emerald-50 text-emerald-700 border-emerald-200",
  abgelehnt: "bg-muted text-muted-foreground border-border",
  gesperrt: "bg-red-50 text-red-700 border-red-200",
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  offen: "Offen",
  bezahlt: "Bezahlt",
  ueberfaellig: "Überfällig",
}

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, string> = {
  offen: "bg-amber-50 text-amber-700 border-amber-200",
  bezahlt: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ueberfaellig: "bg-red-50 text-red-700 border-red-200",
}

function euro(n: number) {
  return `${n.toFixed(2)} €`
}

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
}: {
  icon: typeof Building2
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

export function PlatformAdminDashboard() {
  const providers = useProviders()
  const payments = usePayments()

  const summary = useMemo(() => {
    const outstanding = payments
      .filter((p) => p.status !== "bezahlt")
      .reduce((s, p) => s + p.amount, 0)
    const collected = payments.filter((p) => p.status === "bezahlt").reduce((s, p) => s + p.amount, 0)
    return {
      totalProviders: providers.length,
      pending: providers.filter((p) => p.status === "ausstehend").length,
      approved: providers.filter((p) => p.status === "freigegeben").length,
      outstanding,
      collected,
    }
  }, [providers, payments])

  const hasData = providers.length > 0 || payments.length > 0

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-muted/40 p-4">
        <p className="text-sm text-muted-foreground">
          {hasData
            ? "Verwalten Sie Registrierungen und Zahlungen Ihrer Krankenfahrdienste."
            : "Noch keine Daten vorhanden. Laden Sie Musterdaten, um die Funktionen auszuprobieren."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => seedSampleData()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            Musterdaten laden
          </button>
          {hasData ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Alle Anbieter und Zahlungen wirklich löschen?")) clearPlatformData()
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Daten zurücksetzen
            </button>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Building2}
          label="Anbieter gesamt"
          value={String(summary.totalProviders)}
          tint="bg-emerald-50 text-emerald-600"
        />
        <StatCard icon={Clock} label="Ausstehende Anträge" value={String(summary.pending)} tint="bg-amber-50 text-amber-600" />
        <StatCard icon={Wallet} label="Offene Zahlungen" value={euro(summary.outstanding)} tint="bg-red-50 text-red-600" />
        <StatCard icon={Euro} label="Eingenommen" value={euro(summary.collected)} tint="bg-blue-50 text-blue-600" />
      </section>

      <RegistrationsPanel providers={providers} />

      <PaymentsPanel providers={providers} payments={payments} />
    </div>
  )
}

const STATUS_FILTERS: { key: ProviderStatus | "alle"; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "ausstehend", label: "Ausstehend" },
  { key: "freigegeben", label: "Freigegeben" },
  { key: "abgelehnt", label: "Abgelehnt" },
  { key: "gesperrt", label: "Gesperrt" },
]

function RegistrationsPanel({ providers }: { providers: Provider[] }) {
  const [filter, setFilter] = useState<ProviderStatus | "alle">("alle")
  const filtered = filter === "alle" ? providers : providers.filter((p) => p.status === filter)

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Building2 className="size-5 text-muted-foreground" aria-hidden="true" />
          Registrierungen
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filter === f.key
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-border bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Registrierungen in dieser Ansicht.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {filtered.map((p) => (
            <ProviderRow key={p.id} provider={p} />
          ))}
        </ul>
      )}
    </section>
  )
}

function ProviderRow({ provider: p }: { provider: Provider }) {
  return (
    <li className="flex flex-col gap-3 py-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PROVIDER_STATUS_STYLES[p.status]}`}>
            {PROVIDER_STATUS_LABELS[p.status]}
          </span>
          <p className="font-semibold text-foreground">{p.company}</p>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {p.contactName} · {p.email}
          {p.phone ? ` · ${p.phone}` : ""}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {[p.city, p.serviceArea, p.fleetSize != null ? `${p.fleetSize} Fahrzeuge` : null]
            .filter(Boolean)
            .join(" · ") || "Keine weiteren Angaben"}
          {` · Provision ${euro(p.ratePerRide)}/Fahrt`}
        </p>
        {p.notes ? <p className="mt-1 text-xs italic text-muted-foreground">{p.notes}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {p.status !== "freigegeben" ? (
          <button
            type="button"
            onClick={() => setProviderStatus(p.id, "freigegeben")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Freigeben
          </button>
        ) : null}

        {p.status !== "gesperrt" && p.status === "freigegeben" ? (
          <button
            type="button"
            onClick={() => setProviderStatus(p.id, "gesperrt")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-100"
          >
            <Ban className="size-4" aria-hidden="true" />
            Sperren
          </button>
        ) : null}

        {p.status === "ausstehend" ? (
          <button
            type="button"
            onClick={() => setProviderStatus(p.id, "abgelehnt")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
          >
            <X className="size-4" aria-hidden="true" />
            Ablehnen
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => deleteProvider(p.id)}
          aria-label={`Anbieter ${p.company} löschen`}
          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

function PaymentsPanel({ providers, payments }: { providers: Provider[]; payments: Payment[] }) {
  const [open, setOpen] = useState(false)
  const [providerId, setProviderId] = useState("")
  const [rides, setRides] = useState("")
  const [amount, setAmount] = useState("")
  const [period, setPeriod] = useState("")
  const [dueDate, setDueDate] = useState("")

  const approved = providers.filter((p) => p.status === "freigegeben")
  const providerName = (id: string) => providers.find((p) => p.id === id)?.company ?? "Unbekannt"
  const selectedRate = providers.find((p) => p.id === providerId)?.ratePerRide ?? 0
  const computedFromRides = rides ? Number(rides) * selectedRate : 0
  const effectiveAmount = amount ? Number(amount) : computedFromRides

  function reset() {
    setProviderId("")
    setRides("")
    setAmount("")
    setPeriod("")
    setDueDate("")
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!providerId || effectiveAmount <= 0) return
    createPayment({
      providerId,
      amount: effectiveAmount,
      rides: rides ? Number(rides) : undefined,
      period,
      dueDate: dueDate || undefined,
    })
    reset()
    setOpen(false)
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
          <Euro className="size-5 text-muted-foreground" aria-hidden="true" />
          Zahlungen
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={approved.length === 0}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {open ? <X className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
          {open ? "Abbrechen" : "Rechnung erstellen"}
        </button>
      </div>

      {approved.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Erst nach Freigabe eines Anbieters können Rechnungen erstellt werden.
        </p>
      ) : null}

      {open ? (
        <form onSubmit={handleAdd} className="mb-6 grid gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-2">
          <Field label="Anbieter" htmlFor="pay-provider">
            <select
              id="pay-provider"
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              required
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">— Anbieter wählen —</option>
              {approved.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.company}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Zeitraum" htmlFor="pay-period">
            <TextInput
              id="pay-period"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="z. B. Januar 2026"
            />
          </Field>
          <Field
            label="Anzahl Fahrten"
            htmlFor="pay-rides"
            hint={
              providerId
                ? `Provision ${euro(selectedRate)}/Fahrt${rides ? ` = ${euro(computedFromRides)}` : ""}`
                : "Provision wird je Anbieter berechnet"
            }
          >
            <TextInput
              id="pay-rides"
              type="number"
              min={0}
              value={rides}
              onChange={(e) => setRides(e.target.value)}
              placeholder="z. B. 42"
            />
          </Field>
          <Field label="Betrag (€)" htmlFor="pay-amount" hint="Leer lassen, um aus Fahrten zu berechnen">
            <TextInput
              id="pay-amount"
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={computedFromRides ? computedFromRides.toFixed(2) : "0.00"}
            />
          </Field>
          <Field label="Fällig am" htmlFor="pay-due">
            <TextInput id="pay-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Rechnung speichern ({euro(effectiveAmount)})
            </button>
          </div>
        </form>
      ) : null}

      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine Zahlungen erfasst.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {payments.map((pay) => (
            <li key={pay.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PAYMENT_STATUS_STYLES[pay.status]}`}>
                    {PAYMENT_STATUS_LABELS[pay.status]}
                  </span>
                  <p className="font-semibold text-foreground">{providerName(pay.providerId)}</p>
                  <span className="font-bold text-foreground">{euro(pay.amount)}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[
                    pay.period,
                    pay.rides != null ? `${pay.rides} Fahrten` : null,
                    pay.dueDate ? `fällig ${pay.dueDate}` : null,
                    pay.paidAt ? `bezahlt ${new Date(pay.paidAt).toLocaleDateString("de-DE")}` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Keine weiteren Angaben"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {pay.status !== "bezahlt" ? (
                  <button
                    type="button"
                    onClick={() => setPaymentStatus(pay.id, "bezahlt")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Check className="size-4" aria-hidden="true" />
                    Als bezahlt markieren
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPaymentStatus(pay.id, "offen")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted"
                  >
                    Auf offen setzen
                  </button>
                )}
                {pay.status === "offen" ? (
                  <button
                    type="button"
                    onClick={() => setPaymentStatus(pay.id, "ueberfaellig")}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    Überfällig
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => deletePayment(pay.id)}
                  aria-label="Zahlung löschen"
                  className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function PlatformDashboardHeader() {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-4 sm:px-6">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-foreground">Betreiber-Administration</h1>
        <p className="text-sm text-muted-foreground">Registrierungen & Zahlungen verwalten</p>
      </div>
      <button
        type="button"
        onClick={() => logoutPlatformAdmin()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Abmelden
      </button>
    </header>
  )
}
