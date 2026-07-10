"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileDown,
  Info,
  ReceiptText,
  Search,
} from "lucide-react"
import { FEE_PER_RIDE, type Booking, type BookingStatus } from "@/lib/store"

// Anzahl Fahrten pro Seite in der Belegliste, damit lange Monate (z. B. 100 Fahrten)
// nicht zu einer riesigen Tabelle werden.
const PAGE_SIZE = 20

// Kundennummer des Fahrdiensts bei der Vermittlungsplattform.
// In der Praxis stammt diese aus dem Anbieterkonto; hier fest hinterlegt.
const CUSTOMER_NO = "KUNDE123"

const MONTH_NAMES = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
]

const STATUS_LABELS: Record<BookingStatus, string> = {
  neu: "Neu",
  zugewiesen: "Zugewiesen",
  abgeschlossen: "Abgeschlossen",
  storniert: "Storniert",
}

// Für die Abrechnung relevantes Datum: Fahrtdatum, ersatzweise Buchungsdatum.
function billingDate(b: Booking): Date {
  const raw = b.rideDate || b.createdAt
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? new Date(b.createdAt) : d
}

// Monatsschlüssel "YYYY-MM" für Gruppierung.
function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(key: string): string {
  const [year, month] = key.split("-")
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`
}

// Verwendungszweck für die gesamte Monatsrechnung, z. B. "RE-2026-06-KUNDE123".
function verwendungszweck(key: string): string {
  return `RE-${key}-${CUSTOMER_NO}`
}

// Patientennamen anonymisieren: nur Initialen, z. B. "Maria Schulz" -> "M. S.".
function anonymizePatient(name: string): string {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
  return initials.length ? `${initials.join(". ")}.` : "—"
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" })
}

// Fälligkeit: immer der 1. des auf den Abrechnungsmonat folgenden Monats.
// Beispiel: Abrechnung "2026-06" (Juni) -> fällig am 01.07.2026.
function dueDateForMonth(key: string): Date {
  const [year, month] = key.split("-").map(Number)
  // month ist 1-basiert; new Date(year, month, 1) ergibt den 1. des Folgemonats.
  return new Date(year, month, 1)
}

// Tagesgenauer Vergleich (ohne Uhrzeit): liegt die Fälligkeit in der Vergangenheit?
function isPastDue(due: Date): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDay = new Date(due)
  dueDay.setHours(0, 0, 0, 0)
  return today > dueDay
}

// Anzahl Tage, die eine Rechnung überfällig ist (>= 1, wenn überfällig).
function daysOverdue(due: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDay = new Date(due)
  dueDay.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((today.getTime() - dueDay.getTime()) / 86_400_000))
}

// Beträge in deutscher Schreibweise, z. B. "284,00 €".
function formatEuro(value: number): string {
  return `${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

type InvoiceRow = {
  id: string
  bookingNumber: string
  date: Date
  patient: string
  status: BookingStatus
  fee: number
}

export function CommissionInvoice({ bookings }: { bookings: Booking[] }) {
  // Nur abrechenbare Fahrten (keine Stornos) nach Monat gruppieren.
  const monthsWithData = useMemo(() => {
    const keys = new Set<string>()
    for (const b of bookings) {
      if (b.status === "storniert") continue
      keys.add(monthKey(billingDate(b)))
    }
    return Array.from(keys).sort((a, b) => b.localeCompare(a))
  }, [bookings])

  const fallbackMonth = monthKey(new Date())
  const [selectedMonth, setSelectedMonth] = useState<string>(monthsWithData[0] ?? fallbackMonth)
  const [page, setPage] = useState(1)

  // Falls sich die verfügbaren Monate ändern und die Auswahl ungültig wird.
  const activeMonth = monthsWithData.includes(selectedMonth)
    ? selectedMonth
    : monthsWithData[0] ?? fallbackMonth

  // Verfügbare Jahre (absteigend) für den Jahr-Filter.
  const yearsWithData = useMemo(() => {
    const set = new Set<string>()
    for (const key of monthsWithData) set.add(key.slice(0, 4))
    return Array.from(set).sort((a, b) => b.localeCompare(a))
  }, [monthsWithData])

  const activeYear = activeMonth.slice(0, 4)

  // Monate des ausgewählten Jahres (absteigend) für das Monats-Dropdown.
  const monthsInActiveYear = useMemo(
    () => monthsWithData.filter((key) => key.startsWith(activeYear)),
    [monthsWithData, activeYear],
  )

  // Wechselt das Jahr und springt automatisch auf den jüngsten Monat darin.
  function handleYearChange(year: string) {
    const firstMonth = monthsWithData.find((key) => key.startsWith(year))
    if (firstMonth) setSelectedMonth(firstMonth)
    setPage(1)
  }

  function handleMonthChange(key: string) {
    setSelectedMonth(key)
    setPage(1)
  }

  const rows: InvoiceRow[] = useMemo(() => {
    return bookings
      .filter((b) => b.status !== "storniert" && monthKey(billingDate(b)) === activeMonth)
      .map((b) => ({
        id: b.id,
        bookingNumber: b.bookingNumber,
        date: billingDate(b),
        patient: anonymizePatient(b.patientName),
        status: b.status,
        fee: b.fee ?? FEE_PER_RIDE,
      }))
      .sort((a, b) => a.bookingNumber.localeCompare(b.bookingNumber))
  }, [bookings, activeMonth])

  const total = rows.reduce((sum, r) => sum + r.fee, 0)
  const reference = verwendungszweck(activeMonth)
  const label = monthLabel(activeMonth)

  // Zahlungsziel: immer der 1. des Folgemonats. Überfällig nur, wenn ein Betrag offen ist.
  const dueDate = dueDateForMonth(activeMonth)
  const overdue = total > 0 && isPastDue(dueDate)
  const overdueDays = overdue ? daysOverdue(dueDate) : 0

  const [copied, setCopied] = useState(false)
  const [query, setQuery] = useState("")

  // Suche filtert nur die angezeigte Liste; die Gesamtsumme bleibt der volle Monatsbetrag.
  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.bookingNumber.toLowerCase().includes(q) ||
        r.patient.toLowerCase().includes(q) ||
        STATUS_LABELS[r.status].toLowerCase().includes(q) ||
        formatDate(r.date).includes(q),
    )
  }, [rows, query])

  // Pagination: aktuelle Seite begrenzen und nur den passenden Ausschnitt anzeigen.
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pagedRows = useMemo(
    () => filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filteredRows, currentPage],
  )
  const firstRowIndex = filteredRows.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const lastRowIndex = Math.min(currentPage * PAGE_SIZE, filteredRows.length)

  function handleQueryChange(value: string) {
    setQuery(value)
    setPage(1)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reference)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Fallback: Auswahl ist nicht kritisch – stilles Scheitern.
    }
  }

  function handleSavePdf() {
    const tableRows = rows
      .map(
        (r) => `
          <tr>
            <td class="mono">${escapeHtml(r.bookingNumber)}</td>
            <td>${escapeHtml(formatDate(r.date))}</td>
            <td>${escapeHtml(r.patient)}</td>
            <td>${escapeHtml(STATUS_LABELS[r.status])}</td>
            <td class="right">${formatEuro(r.fee)}</td>
          </tr>`,
      )
      .join("")

    const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>Provisionsabrechnung ${escapeHtml(label)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1f2937; margin: 40px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .muted { color: #6b7280; font-size: 13px; }
  .ref-box { margin: 24px 0; padding: 16px 20px; border: 1px solid #d1d5db; border-radius: 12px; background: #f9fafb; }
  .ref-box .label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
  .ref-box .value { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 20px; font-weight: 700; margin-top: 4px; }
  .hint { font-size: 12px; color: #6b7280; margin-top: 8px; }
  .total { font-size: 22px; font-weight: 700; }
  .due { font-size: 13px; margin-top: 6px; }
  .overdue { margin-top: 16px; padding: 10px 14px; border: 1px solid #fecaca; background: #fef2f2; color: #b91c1c; border-radius: 10px; font-size: 13px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
  th { background: #f3f4f6; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #6b7280; }
  .right { text-align: right; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
  tfoot td { font-weight: 700; border-top: 2px solid #d1d5db; }
</style>
</head>
<body>
  <h1>Provisionsabrechnung</h1>
  <p class="muted">Abrechnungszeitraum: ${escapeHtml(label)} · Vermittlungsprovision ${formatEuro(FEE_PER_RIDE)} pro Fahrt</p>
  <div class="ref-box">
    <div class="label">Verwendungszweck (für alle Fahrten dieses Monats)</div>
    <div class="value">${escapeHtml(reference)}</div>
    <div class="hint">Bitte exakt diesen Verwendungszweck bei der Überweisung angeben.</div>
  </div>
  <p class="total">Gesamtbetrag: ${formatEuro(total)}</p>
  <p class="due">Zahlbar bis: <strong>${escapeHtml(formatDate(dueDate))}</strong> (1. des Folgemonats)</p>
  ${
    overdue
      ? `<p class="overdue">Überfällig seit ${escapeHtml(formatDate(dueDate))} (${overdueDays} ${overdueDays === 1 ? "Tag" : "Tage"}) — bitte umgehend begleichen.</p>`
      : ""
  }
  <table>
    <thead>
      <tr>
        <th>Buchungsnummer</th>
        <th>Datum</th>
        <th>Patient (anonym)</th>
        <th>Status</th>
        <th class="right">Gebühr</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
    <tfoot>
      <tr>
        <td colspan="4">Summe (${rows.length} Fahrten)</td>
        <td class="right">${formatEuro(total)}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`

    const win = window.open("", "_blank")
    if (!win) return
    win.document.write(html)
    win.document.close()
    win.focus()
    // Kurz warten, damit der Inhalt gerendert ist, dann Druckdialog (→ "Als PDF speichern").
    window.setTimeout(() => win.print(), 250)
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Zahlungs-Header */}
      <div className="flex flex-col gap-5 border-b border-border bg-muted/30 p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
            <ReceiptText className="size-5 text-muted-foreground" aria-hidden="true" />
            Monatliche Provisionsabrechnung
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">Gesamtsumme für den Monat</p>
          <p className="text-3xl font-bold tracking-tight text-foreground">
            {label}: {formatEuro(total)}
          </p>

          {/* Zahlungsziel / Überfälligkeit */}
          {overdue ? (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-sm font-semibold text-red-700">
              <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
              Überfällig seit {formatDate(dueDate)} ({overdueDays}{" "}
              {overdueDays === 1 ? "Tag" : "Tage"}) — bitte umgehend begleichen.
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              Zahlbar bis <span className="font-semibold text-foreground">{formatDate(dueDate)}</span>{" "}
              (1. des Folgemonats)
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label htmlFor="invoice-year" className="sr-only">
              Abrechnungsjahr wählen
            </label>
            <select
              id="invoice-year"
              value={activeYear}
              onChange={(e) => handleYearChange(e.target.value)}
              disabled={yearsWithData.length === 0}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {yearsWithData.length === 0 ? (
                <option value={fallbackMonth.slice(0, 4)}>{fallbackMonth.slice(0, 4)}</option>
              ) : (
                yearsWithData.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))
              )}
            </select>
            <label htmlFor="invoice-month" className="sr-only">
              Abrechnungsmonat wählen
            </label>
            <select
              id="invoice-month"
              value={activeMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              disabled={monthsWithData.length === 0}
              className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {monthsInActiveYear.length === 0 ? (
                <option value={fallbackMonth}>{MONTH_NAMES[Number(fallbackMonth.slice(5, 7)) - 1]}</option>
              ) : (
                monthsInActiveYear.map((key) => (
                  <option key={key} value={key}>
                    {MONTH_NAMES[Number(key.slice(5, 7)) - 1]}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* Verwendungszweck-Box mit Kopieren */}
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Verwendungszweck
          </p>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-lg font-bold text-foreground">
              {reference}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Verwendungszweck in die Zwischenablage kopieren"
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
                copied
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-input text-foreground hover:bg-muted"
              }`}
            >
              {copied ? (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  Kopiert
                </>
              ) : (
                <>
                  <Copy className="size-4" aria-hidden="true" />
                  Kopieren
                </>
              )}
            </button>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Dieser Verwendungszweck gilt für alle unten aufgeführten Fahrten dieses Monats.
          </p>
          <button
            type="button"
            onClick={handleSavePdf}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <FileDown className="size-4" aria-hidden="true" />
            Rechnung als PDF speichern
          </button>
        </div>
      </div>

      {/* Nachweis-Tabelle (Belegliste) */}
      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">Nachweis der abgerechneten Fahrten</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Belegliste zum oben genannten Verwendungszweck — sie weist nach, wie sich die Gesamtsumme zusammensetzt.
          </p>
        </div>
        {rows.length > 0 ? (
          <div className="relative w-full sm:w-64">
            <label htmlFor="invoice-search" className="sr-only">
              Fahrten durchsuchen
            </label>
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              id="invoice-search"
              type="search"
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Buchungsnr., Patient, Status…"
              className="w-full rounded-lg border border-input bg-background py-1.5 pl-8 pr-3 text-sm text-foreground shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <p className="px-6 pb-6 text-sm text-muted-foreground">
          Für {label} liegen keine abrechenbaren Fahrten vor.
        </p>
      ) : (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground shadow-[inset_0_-1px_0_0_var(--color-border)]">
                <th scope="col" className="px-6 py-3 font-medium">
                  Buchungsnummer
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                  Datum
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                  Patient (anonym)
                </th>
                <th scope="col" className="px-6 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right font-medium">
                  Gebühr
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Keine Fahrten für „{query}“ gefunden.
                  </td>
                </tr>
              ) : (
                pagedRows.map((r) => (
                  <tr key={r.id} className="text-foreground">
                    <td className="px-6 py-3 font-mono font-medium">{r.bookingNumber}</td>
                    <td className="px-6 py-3 text-muted-foreground">{formatDate(r.date)}</td>
                    <td className="px-6 py-3">{r.patient}</td>
                    <td className="px-6 py-3 text-muted-foreground">{STATUS_LABELS[r.status]}</td>
                    <td className="px-6 py-3 text-right tabular-nums">{formatEuro(r.fee)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="sticky bottom-0 z-10">
              <tr className="bg-muted font-semibold text-foreground shadow-[inset_0_1px_0_0_var(--color-border)]">
                <td className="px-6 py-3" colSpan={4}>
                  Summe ({rows.length} {rows.length === 1 ? "Fahrt" : "Fahrten"}
                  {query.trim() ? `, ${filteredRows.length} angezeigt` : ""})
                </td>
                <td className="px-6 py-3 text-right tabular-nums">{formatEuro(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Pagination: nur anzeigen, wenn mehr als eine Seite vorhanden ist */}
      {rows.length > 0 && filteredRows.length > 0 && pageCount > 1 ? (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-6 py-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Fahrten {firstRowIndex}–{lastRowIndex} von {filteredRows.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              Zurück
            </button>
            <span className="text-xs text-muted-foreground" aria-live="polite">
              Seite {currentPage} von {pageCount}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage >= pageCount}
              className="inline-flex items-center gap-1 rounded-lg border border-input px-2.5 py-1.5 text-xs font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Weiter
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
