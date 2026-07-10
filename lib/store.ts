"use client"

import { useEffect, useState } from "react"

// --- Types -----------------------------------------------------------------

export type BookingStatus = "neu" | "zugewiesen" | "abgeschlossen" | "storniert"

export type Booking = {
  id: string
  bookingNumber: string
  type: "gkv" | "privat"
  patientName: string
  phone?: string
  insurance?: string
  verordnungsgrund?: string
  transportArt?: string
  vehicleType?: string
  pickup: string
  destination: string
  rideDate?: string
  rideTime?: string
  price?: number
  notes?: string
  estimatedMinutes?: number
  estimatedDistanceKm?: number
  fee: number
  status: BookingStatus
  assignedDriverId?: string | null
  createdAt: string
}

export type Driver = {
  id: string
  name: string
  email: string
  phone?: string
  vehicle?: string
  active: boolean
  createdAt: string
}

// --- Platform (operator) types ---------------------------------------------

export type ProviderStatus = "ausstehend" | "freigegeben" | "abgelehnt" | "gesperrt"

export type Provider = {
  id: string
  company: string
  contactName: string
  email: string
  phone?: string
  city?: string
  serviceArea?: string
  fleetSize?: number
  notes?: string
  status: ProviderStatus
  ratePerRide: number // Provision pro Fahrt für diesen Anbieter
  createdAt: string
}

export type CreateProviderInput = {
  company: string
  contactName: string
  email: string
  phone?: string
  city?: string
  serviceArea?: string
  fleetSize?: number
  notes?: string
}

export type PaymentStatus = "offen" | "bezahlt" | "ueberfaellig"

export type Payment = {
  id: string
  providerId: string
  amount: number
  rides?: number
  period?: string
  status: PaymentStatus
  dueDate?: string
  createdAt: string
  paidAt?: string | null
}

export type CreatePaymentInput = {
  providerId: string
  amount: number
  rides?: number
  period?: string
  dueDate?: string
}

export type CreateBookingInput = {
  type: "gkv" | "privat"
  patientName: string
  phone?: string
  insurance?: string
  verordnungsgrund?: string
  transportArt?: string
  vehicleType?: string
  pickup: string
  destination: string
  rideDate?: string
  rideTime?: string
  price?: number
  notes?: string
  estimatedMinutes?: number
  estimatedDistanceKm?: number
}

// --- Live-Tracking ---------------------------------------------------------

export type LatLng = [number, number]

export type TrackingState = {
  bookingId: string
  progress: number // 0..1 entlang der Route
  running: boolean
  position: LatLng
  updatedAt: string
}

// Vermittlungsprovision: 2 EUR pro Fahrt
export const FEE_PER_RIDE = 2

// --- Tarife (vom Fahrdienst konfigurierbar) --------------------------------

export type Surcharge = {
  id: string
  label: string
  amount: number
}

export type Pricing = {
  baseFare: number // Grundpreis pro Fahrt
  perKm: number // Kilometergeld
  surcharges: Surcharge[] // Zuschläge (z. B. Tragestuhl)
}

export const DEFAULT_PRICING: Pricing = {
  baseFare: 4.5,
  perKm: 2.1,
  surcharges: [
    { id: "tragestuhl", label: "Tragestuhl", amount: 15 },
    { id: "rollstuhl", label: "Rollstuhl", amount: 12 },
    { id: "liegend", label: "Liegendtransport", amount: 25 },
    { id: "begleit", label: "Begleitperson", amount: 5 },
  ],
}

const BOOKINGS_KEY = "kfd_bookings"
const BOOKING_COUNTER_KEY = "kfd_booking_counter"
const DRIVERS_KEY = "kfd_drivers"
const ADMIN_PW_KEY = "kfd_admin_password"
const SESSION_KEY = "kfd_admin_session"
const PROVIDERS_KEY = "kfd_providers"
const PAYMENTS_KEY = "kfd_payments"
const PLATFORM_PW_KEY = "kfd_platform_password"
const PLATFORM_SESSION_KEY = "kfd_platform_session"
const PRICING_KEY = "kfd_pricing"
const TRACKING_KEY = "kfd_tracking"
const DRIVER_PW_KEY = "kfd_driver_passwords" // Record<driverId, password>
const DRIVER_SESSION_KEY = "kfd_driver_session" // driverId | null

// --- Low-level persistence -------------------------------------------------

function isBrowser() {
  return typeof window !== "undefined"
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return
  window.localStorage.setItem(key, JSON.stringify(value))
  emitChange()
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

// Fortlaufende, gut lesbare Buchungsnummer, z. B. "KF-2026-0001".
// Der Zähler wird global persistiert, damit Nummern auch nach dem Löschen
// einzelner Buchungen eindeutig bleiben und nicht erneut vergeben werden.
function nextBookingNumber(): string {
  const current = read<number>(BOOKING_COUNTER_KEY, 0)
  const next = current + 1
  if (isBrowser()) {
    window.localStorage.setItem(BOOKING_COUNTER_KEY, JSON.stringify(next))
  }
  const year = new Date().getFullYear()
  return `KF-${year}-${String(next).padStart(4, "0")}`
}

// --- Reactive subscription -------------------------------------------------

const listeners = new Set<() => void>()

function emitChange() {
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = () => listener()
  if (isBrowser()) window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    if (isBrowser()) window.removeEventListener("storage", onStorage)
  }
}

// --- Bookings --------------------------------------------------------------

export function getBookings(): Booking[] {
  const bookings = read<Booking[]>(BOOKINGS_KEY, [])
  // Bestehende Buchungen ohne Buchungsnummer einmalig nachrüsten.
  const missing = bookings.some((b) => !b.bookingNumber)
  if (missing) {
    const numbered = bookings
      .slice()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      .map((b) => (b.bookingNumber ? b : { ...b, bookingNumber: nextBookingNumber() }))
    write(BOOKINGS_KEY, numbered)
    return numbered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }
  return bookings.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createBooking(input: CreateBookingInput): { ok: true; id: string; bookingNumber: string } {
  const bookings = read<Booking[]>(BOOKINGS_KEY, [])
  const estimate =
    input.estimatedMinutes && input.estimatedDistanceKm
      ? { minutes: input.estimatedMinutes, km: input.estimatedDistanceKm }
      : estimateRide(input.pickup, input.destination, input.estimatedDistanceKm)
  const booking: Booking = {
    id: uid(),
    bookingNumber: nextBookingNumber(),
    type: input.type,
    patientName: input.patientName,
    phone: input.phone,
    insurance: input.insurance,
    verordnungsgrund: input.verordnungsgrund,
    transportArt: input.transportArt,
    vehicleType: input.vehicleType,
    pickup: input.pickup,
    destination: input.destination,
    rideDate: input.rideDate,
    rideTime: input.rideTime,
    price: input.price,
    notes: input.notes,
    estimatedMinutes: estimate.minutes,
    estimatedDistanceKm: estimate.km,
    fee: FEE_PER_RIDE,
    status: "neu",
    assignedDriverId: null,
    createdAt: new Date().toISOString(),
  }
  write(BOOKINGS_KEY, [booking, ...bookings])
  return { ok: true, id: booking.id, bookingNumber: booking.bookingNumber }
}

export function assignDriver(bookingId: string, driverId: string | null) {
  const bookings = read<Booking[]>(BOOKINGS_KEY, [])
  write(
    BOOKINGS_KEY,
    bookings.map((b) =>
      b.id === bookingId
        ? { ...b, assignedDriverId: driverId, status: driverId ? "zugewiesen" : "neu" }
        : b,
    ),
  )
}

export function updateBookingStatus(bookingId: string, status: BookingStatus) {
  const bookings = read<Booking[]>(BOOKINGS_KEY, [])
  write(
    BOOKINGS_KEY,
    bookings.map((b) => (b.id === bookingId ? { ...b, status } : b)),
  )
}

// --- Live-Tracking ---------------------------------------------------------

// München als Demo-Zentrum (echte Geokodierung ist im reinen Browser-Demo nicht verfügbar).
const CITY_CENTER: LatLng = [48.1372, 11.5756]

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h
}

// Erzeugt deterministische, plausible Koordinaten rund um das Stadtzentrum.
function pseudoPoint(seed: string): LatLng {
  const h = hashString(seed)
  const latOffset = (((h % 1000) / 1000) - 0.5) * 0.12
  const lngOffset = ((((h >> 10) % 1000) / 1000) - 0.5) * 0.18
  return [CITY_CENTER[0] + latOffset, CITY_CENTER[1] + lngOffset]
}

export function getBookingRoute(booking: Pick<Booking, "id" | "pickup" | "destination">): {
  pickup: LatLng
  dest: LatLng
} {
  return {
    pickup: pseudoPoint(`${booking.id}|${booking.pickup}|pickup`),
    dest: pseudoPoint(`${booking.id}|${booking.destination}|dest`),
  }
}

export function interpolate(a: LatLng, b: LatLng, t: number): LatLng {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
}

// --- Geschätzte Fahrtzeit --------------------------------------------------

// Durchschnittsgeschwindigkeit für Krankenfahrten (Stadt/Umland inkl. Stopps).
const AVG_SPEED_KMH = 32

export type RideEstimate = { km: number; minutes: number }

// Haversine-Distanz (Luftlinie) in Kilometern.
function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLng = ((b[1] - a[1]) * Math.PI) / 180
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Schätzt Distanz und Fahrtzeit. Ist die Strecke bekannt (Privatfahrt), wird sie
// direkt genutzt; sonst aus den Demo-Koordinaten der Adressen abgeleitet
// (Luftlinie × 1,3 Umwegfaktor für die Straßenführung).
export function estimateRide(pickup: string, destination: string, knownKm?: number): RideEstimate {
  let km = knownKm
  if (!Number.isFinite(km) || (km ?? 0) <= 0) {
    const p = pseudoPoint(`${pickup}|pickup`)
    const d = pseudoPoint(`${destination}|dest`)
    km = distanceKm(p, d) * 1.3
  }
  const safeKm = Math.max(1, km ?? 1)
  const minutes = Math.max(5, Math.round((safeKm / AVG_SPEED_KMH) * 60))
  return { km: Math.round(safeKm * 10) / 10, minutes }
}

// Liefert die gespeicherte Schätzung oder berechnet sie nach (z. B. für ältere Buchungen).
export function getRideEstimate(
  b: Pick<Booking, "pickup" | "destination" | "estimatedMinutes" | "estimatedDistanceKm">,
): RideEstimate {
  if (b.estimatedMinutes && b.estimatedDistanceKm) {
    return { km: b.estimatedDistanceKm, minutes: b.estimatedMinutes }
  }
  return estimateRide(b.pickup, b.destination)
}

// Formatiert Minuten als "25 min" bzw. "1 h 5 min".
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m} min` : `${h} h`
}

function getTrackingMap(): Record<string, TrackingState> {
  return read<Record<string, TrackingState>>(TRACKING_KEY, {})
}

export function getTracking(bookingId: string): TrackingState | null {
  return getTrackingMap()[bookingId] ?? null
}

export function startTracking(booking: Pick<Booking, "id" | "pickup" | "destination">) {
  const map = getTrackingMap()
  const existing = map[booking.id]
  const route = getBookingRoute(booking)
  const progress = existing && existing.progress < 1 ? existing.progress : 0
  map[booking.id] = {
    bookingId: booking.id,
    progress,
    running: true,
    position: interpolate(route.pickup, route.dest, progress),
    updatedAt: new Date().toISOString(),
  }
  write(TRACKING_KEY, map)
}

export function pauseTracking(bookingId: string) {
  const map = getTrackingMap()
  const t = map[bookingId]
  if (!t) return
  map[bookingId] = { ...t, running: false, updatedAt: new Date().toISOString() }
  write(TRACKING_KEY, map)
}

// Aktualisiert den Fortschritt; bei Ankunft (>=1) wird die Fahrt automatisch abgeschlossen.
export function advanceTracking(
  booking: Pick<Booking, "id" | "pickup" | "destination">,
  progress: number,
) {
  const map = getTrackingMap()
  const route = getBookingRoute(booking)
  const clamped = Math.min(1, Math.max(0, progress))
  const arrived = clamped >= 1
  map[booking.id] = {
    bookingId: booking.id,
    progress: clamped,
    running: !arrived,
    position: arrived ? route.dest : interpolate(route.pickup, route.dest, clamped),
    updatedAt: new Date().toISOString(),
  }
  write(TRACKING_KEY, map)
  if (arrived) {
    // Ziel erreicht -> automatisch als abgeschlossen markieren.
    updateBookingStatus(booking.id, "abgeschlossen")
  }
}

export function resetTracking(bookingId: string) {
  const map = getTrackingMap()
  if (!(bookingId in map)) return
  delete map[bookingId]
  write(TRACKING_KEY, map)
}

// --- Drivers ---------------------------------------------------------------

export function getDrivers(): Driver[] {
  return read<Driver[]>(DRIVERS_KEY, []).sort((a, b) => a.name.localeCompare(b.name))
}

export function createDriver(input: { name: string; email: string; phone?: string; vehicle?: string }): string {
  const drivers = read<Driver[]>(DRIVERS_KEY, [])
  const driver: Driver = {
    id: uid(),
    name: input.name,
    email: input.email.trim().toLowerCase(),
    phone: input.phone,
    vehicle: input.vehicle,
    active: true,
    createdAt: new Date().toISOString(),
  }
  write(DRIVERS_KEY, [...drivers, driver])
  return driver.id
}

export function setDriverActive(id: string, active: boolean) {
  const drivers = read<Driver[]>(DRIVERS_KEY, [])
  write(
    DRIVERS_KEY,
    drivers.map((d) => (d.id === id ? { ...d, active } : d)),
  )
}

export function deleteDriver(id: string) {
  const drivers = read<Driver[]>(DRIVERS_KEY, [])
  write(
    DRIVERS_KEY,
    drivers.filter((d) => d.id !== id),
  )
  // Unassign this driver from any bookings.
  const bookings = read<Booking[]>(BOOKINGS_KEY, [])
  write(
    BOOKINGS_KEY,
    bookings.map((b) =>
      b.assignedDriverId === id ? { ...b, assignedDriverId: null, status: b.status === "zugewiesen" ? "neu" : b.status } : b,
    ),
  )
  // Zugehöriges Passwort entfernen.
  clearDriverPassword(id)
}

// --- Fahrer-Login & Fahrt-Annahme ------------------------------------------

export function findDriverByEmail(email: string): Driver | null {
  const norm = email.trim().toLowerCase()
  return read<Driver[]>(DRIVERS_KEY, []).find((d) => d.email === norm) ?? null
}

function getDriverPasswords(): Record<string, string> {
  return read<Record<string, string>>(DRIVER_PW_KEY, {})
}

export function driverHasPassword(driverId: string): boolean {
  return driverId in getDriverPasswords()
}

export function getDriverPassword(driverId: string): string | null {
  return getDriverPasswords()[driverId] ?? null
}

// Admin setzt/aktualisiert das Fahrer-Passwort direkt.
export function setDriverPassword(driverId: string, password: string): { ok: boolean; error?: string } {
  if (password.length < 6) return { ok: false, error: "Das Passwort muss mindestens 6 Zeichen lang sein." }
  const passwords = getDriverPasswords()
  passwords[driverId] = password
  write(DRIVER_PW_KEY, passwords)
  return { ok: true }
}

export function clearDriverPassword(driverId: string) {
  const passwords = getDriverPasswords()
  if (driverId in passwords) {
    delete passwords[driverId]
    write(DRIVER_PW_KEY, passwords)
  }
}

// Erzeugt ein zufälliges, gut lesbares Passwort.
export function generatePassword(length = 10): string {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let out = ""
  const cryptoObj = typeof globalThis !== "undefined" ? (globalThis.crypto as Crypto | undefined) : undefined
  if (cryptoObj?.getRandomValues) {
    const arr = new Uint32Array(length)
    cryptoObj.getRandomValues(arr)
    for (let i = 0; i < length; i++) out += chars[arr[i] % chars.length]
  } else {
    for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

// Login per E-Mail. Beim ersten Login wird das eingegebene Passwort gesetzt.
export function loginDriver(
  email: string,
  password: string,
): { ok: boolean; error?: string; firstLogin?: boolean } {
  const driver = findDriverByEmail(email)
  if (!driver) return { ok: false, error: "Kein Fahrerkonto mit dieser E-Mail. Bitte vom Fahrdienst anlegen lassen." }
  if (!driver.active) return { ok: false, error: "Dieses Fahrerkonto ist deaktiviert. Bitte den Fahrdienst kontaktieren." }
  if (password.length < 6) return { ok: false, error: "Das Passwort muss mindestens 6 Zeichen lang sein." }

  const passwords = getDriverPasswords()
  const firstLogin = !(driver.id in passwords)
  if (firstLogin) {
    passwords[driver.id] = password
    write(DRIVER_PW_KEY, passwords)
  } else if (passwords[driver.id] !== password) {
    return { ok: false, error: "Falsches Passwort." }
  }
  write(DRIVER_SESSION_KEY, driver.id)
  return { ok: true, firstLogin }
}

export function logoutDriver() {
  write(DRIVER_SESSION_KEY, null)
}

export function getCurrentDriverId(): string | null {
  return read<string | null>(DRIVER_SESSION_KEY, null)
}

export function getCurrentDriver(): Driver | null {
  const id = getCurrentDriverId()
  if (!id) return null
  return read<Driver[]>(DRIVERS_KEY, []).find((d) => d.id === id) ?? null
}

// Fahrer nimmt eine freie Fahrt an (nur wenn noch nicht vergeben).
export function acceptBooking(bookingId: string, driverId: string): { ok: boolean; error?: string } {
  const bookings = read<Booking[]>(BOOKINGS_KEY, [])
  const booking = bookings.find((b) => b.id === bookingId)
  if (!booking) return { ok: false, error: "Fahrt nicht gefunden." }
  if (booking.assignedDriverId && booking.assignedDriverId !== driverId) {
    return { ok: false, error: "Diese Fahrt wurde bereits von einem anderen Fahrer übernommen." }
  }
  if (booking.status === "storniert") return { ok: false, error: "Diese Fahrt wurde storniert." }
  write(
    BOOKINGS_KEY,
    bookings.map((b) =>
      b.id === bookingId ? { ...b, assignedDriverId: driverId, status: "zugewiesen" } : b,
    ),
  )
  return { ok: true }
}

// Fahrer gibt eine zugewiesene Fahrt wieder frei.
export function releaseBooking(bookingId: string, driverId: string) {
  const bookings = read<Booking[]>(BOOKINGS_KEY, [])
  write(
    BOOKINGS_KEY,
    bookings.map((b) =>
      b.id === bookingId && b.assignedDriverId === driverId
        ? { ...b, assignedDriverId: null, status: "neu" }
        : b,
    ),
  )
}

// --- Tarife (Pricing) ------------------------------------------------------

export function getPricing(): Pricing {
  const stored = read<Pricing | null>(PRICING_KEY, null)
  if (!stored) return DEFAULT_PRICING
  return {
    baseFare: typeof stored.baseFare === "number" ? stored.baseFare : DEFAULT_PRICING.baseFare,
    perKm: typeof stored.perKm === "number" ? stored.perKm : DEFAULT_PRICING.perKm,
    surcharges: Array.isArray(stored.surcharges) ? stored.surcharges : DEFAULT_PRICING.surcharges,
  }
}

export function savePricing(pricing: Pricing) {
  write(PRICING_KEY, pricing)
}

export function resetPricing() {
  write(PRICING_KEY, DEFAULT_PRICING)
}

export function addSurcharge(label: string, amount: number) {
  const pricing = getPricing()
  const surcharge: Surcharge = { id: uid(), label: label.trim(), amount }
  savePricing({ ...pricing, surcharges: [...pricing.surcharges, surcharge] })
}

export function updateSurcharge(id: string, patch: Partial<Omit<Surcharge, "id">>) {
  const pricing = getPricing()
  savePricing({
    ...pricing,
    surcharges: pricing.surcharges.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  })
}

export function removeSurcharge(id: string) {
  const pricing = getPricing()
  savePricing({ ...pricing, surcharges: pricing.surcharges.filter((s) => s.id !== id) })
}

// --- Musterdaten Fahrdienst (Buchungen & Fahrer) ---------------------------

export function seedFahrdienstSampleData(): { bookings: number; drivers: number } {
  const now = Date.now()
  const iso = (offsetDays: number) => new Date(now - offsetDays * 86400000).toISOString()
  const dateStr = (offsetDays: number) => new Date(now + offsetDays * 86400000).toISOString().slice(0, 10)

  const sampleDrivers: Driver[] = [
    {
      id: uid(),
      name: "Stefan Bauer",
      email: "stefan.bauer@beispiel.de",
      phone: "0151 2345678",
      vehicle: "VW Caddy (rollstuhlgerecht)",
      active: true,
      createdAt: iso(30),
    },
    {
      id: uid(),
      name: "Julia Hoffmann",
      email: "julia.hoffmann@beispiel.de",
      phone: "0160 9988776",
      vehicle: "Mercedes Vito",
      active: true,
      createdAt: iso(20),
    },
    {
      id: uid(),
      name: "Kemal Yilmaz",
      email: "kemal.yilmaz@beispiel.de",
      phone: "0170 4455667",
      vehicle: "Opel Vivaro (Trage)",
      active: false,
      createdAt: iso(10),
    },
  ]

  const [d1, d2] = sampleDrivers

  const sampleBookings: Booking[] = [
    {
      id: uid(),
      bookingNumber: nextBookingNumber(),
      type: "gkv",
      patientName: "Helga Schmidt",
      phone: "089 1112233",
      insurance: "AOK Bayern",
      verordnungsgrund: "Dialyse",
      transportArt: "Tragestuhl",
      vehicleType: "Rollstuhlgerecht",
      pickup: "Lindenstraße 12, München",
      destination: "Dialysezentrum Mitte, München",
      rideDate: dateStr(1),
      rideTime: "08:30",
      notes: "Patientin benötigt Begleitung bis zur Station.",
      fee: FEE_PER_RIDE,
      status: "zugewiesen",
      assignedDriverId: d1.id,
      createdAt: iso(3),
    },
    {
      id: uid(),
      bookingNumber: nextBookingNumber(),
      type: "privat",
      patientName: "Werner Klein",
      phone: "089 4445566",
      transportArt: "Sitzend",
      vehicleType: "Standard",
      pickup: "Bahnhofplatz 3, München",
      destination: "Klinikum Großhadern",
      rideDate: dateStr(2),
      rideTime: "14:00",
      price: 45,
      notes: "",
      fee: FEE_PER_RIDE,
      status: "neu",
      assignedDriverId: null,
      createdAt: iso(2),
    },
    {
      id: uid(),
      bookingNumber: nextBookingNumber(),
      type: "gkv",
      patientName: "Maria Wagner",
      phone: "089 7778899",
      insurance: "TK",
      verordnungsgrund: "Strahlentherapie",
      transportArt: "Sitzend",
      vehicleType: "Standard",
      pickup: "Goethestraße 8, München",
      destination: "Strahlenklinik, München",
      rideDate: dateStr(-1),
      rideTime: "10:15",
      notes: "",
      fee: FEE_PER_RIDE,
      status: "abgeschlossen",
      assignedDriverId: d2.id,
      createdAt: iso(5),
    },
    {
      id: uid(),
      bookingNumber: nextBookingNumber(),
      type: "privat",
      patientName: "Ingrid Becker",
      phone: "089 2223344",
      transportArt: "Liegend",
      vehicleType: "Trage",
      pickup: "Seniorenheim Sonnenhof, München",
      destination: "Augenklinik, München",
      rideDate: dateStr(3),
      rideTime: "09:00",
      price: 60,
      notes: "Termin wurde vom Patienten abgesagt.",
      fee: FEE_PER_RIDE,
      status: "storniert",
      assignedDriverId: null,
      createdAt: iso(1),
    },
  ]

  write(DRIVERS_KEY, [...read<Driver[]>(DRIVERS_KEY, []), ...sampleDrivers])
  write(BOOKINGS_KEY, [...sampleBookings, ...read<Booking[]>(BOOKINGS_KEY, [])])
  return { bookings: sampleBookings.length, drivers: sampleDrivers.length }
}

export function clearFahrdienstData() {
  write(BOOKINGS_KEY, [])
  write(DRIVERS_KEY, [])
}

// --- Providers (Krankenfahrdienst-Registrierungen) -------------------------

export function getProviders(): Provider[] {
  return read<Provider[]>(PROVIDERS_KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function registerProvider(input: CreateProviderInput): { ok: true; id: string } {
  const providers = read<Provider[]>(PROVIDERS_KEY, [])
  const provider: Provider = {
    id: uid(),
    company: input.company.trim(),
    contactName: input.contactName.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone?.trim(),
    city: input.city?.trim(),
    serviceArea: input.serviceArea?.trim(),
    fleetSize: input.fleetSize,
    notes: input.notes?.trim(),
    status: "ausstehend",
    ratePerRide: FEE_PER_RIDE,
    createdAt: new Date().toISOString(),
  }
  write(PROVIDERS_KEY, [provider, ...providers])
  return { ok: true, id: provider.id }
}

export function setProviderStatus(id: string, status: ProviderStatus) {
  const providers = read<Provider[]>(PROVIDERS_KEY, [])
  write(
    PROVIDERS_KEY,
    providers.map((p) => (p.id === id ? { ...p, status } : p)),
  )
}

export function setProviderRate(id: string, ratePerRide: number) {
  const providers = read<Provider[]>(PROVIDERS_KEY, [])
  write(
    PROVIDERS_KEY,
    providers.map((p) => (p.id === id ? { ...p, ratePerRide } : p)),
  )
}

export function deleteProvider(id: string) {
  const providers = read<Provider[]>(PROVIDERS_KEY, [])
  write(
    PROVIDERS_KEY,
    providers.filter((p) => p.id !== id),
  )
  // Zugehörige Zahlungen ebenfalls entfernen.
  const payments = read<Payment[]>(PAYMENTS_KEY, [])
  write(
    PAYMENTS_KEY,
    payments.filter((pay) => pay.providerId !== id),
  )
}

// --- Payments (Provisionen / Rechnungen) -----------------------------------

export function getPayments(): Payment[] {
  return read<Payment[]>(PAYMENTS_KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function createPayment(input: CreatePaymentInput): { ok: true; id: string } {
  const payments = read<Payment[]>(PAYMENTS_KEY, [])
  const payment: Payment = {
    id: uid(),
    providerId: input.providerId,
    amount: input.amount,
    rides: input.rides,
    period: input.period?.trim(),
    dueDate: input.dueDate,
    status: "offen",
    createdAt: new Date().toISOString(),
    paidAt: null,
  }
  write(PAYMENTS_KEY, [payment, ...payments])
  return { ok: true, id: payment.id }
}

export function setPaymentStatus(id: string, status: PaymentStatus) {
  const payments = read<Payment[]>(PAYMENTS_KEY, [])
  write(
    PAYMENTS_KEY,
    payments.map((p) =>
      p.id === id ? { ...p, status, paidAt: status === "bezahlt" ? new Date().toISOString() : null } : p,
    ),
  )
}

export function deletePayment(id: string) {
  const payments = read<Payment[]>(PAYMENTS_KEY, [])
  write(
    PAYMENTS_KEY,
    payments.filter((p) => p.id !== id),
  )
}

// --- Platform admin "auth" (demo only, NOT secure) -------------------------

export function hasPlatformAccount(): boolean {
  return read<string | null>(PLATFORM_PW_KEY, null) !== null
}

export function registerPlatformAdmin(password: string): { ok: boolean; error?: string } {
  if (password.length < 6) return { ok: false, error: "Das Passwort muss mindestens 6 Zeichen lang sein." }
  if (hasPlatformAccount()) return { ok: false, error: "Es existiert bereits ein Admin-Konto." }
  write(PLATFORM_PW_KEY, password)
  setPlatformSession(true)
  return { ok: true }
}

export function loginPlatformAdmin(password: string): { ok: boolean; error?: string } {
  const stored = read<string | null>(PLATFORM_PW_KEY, null)
  if (stored === null) return { ok: false, error: "Kein Konto vorhanden. Bitte zuerst einrichten." }
  if (stored !== password) return { ok: false, error: "Falsches Passwort." }
  setPlatformSession(true)
  return { ok: true }
}

export function logoutPlatformAdmin() {
  setPlatformSession(false)
}

function setPlatformSession(active: boolean) {
  if (!isBrowser()) return
  write(PLATFORM_SESSION_KEY, active)
}

export function isPlatformLoggedIn(): boolean {
  return read<boolean>(PLATFORM_SESSION_KEY, false) === true
}

// --- Musterdaten (Demo-Seed) -----------------------------------------------

export function seedSampleData(): { providers: number; payments: number } {
  const now = Date.now()
  const iso = (offsetDays: number) => new Date(now - offsetDays * 86400000).toISOString()
  const dueIso = (offsetDays: number) => new Date(now + offsetDays * 86400000).toISOString().slice(0, 10)

  const sampleProviders: Provider[] = [
    {
      id: uid(),
      company: "Mobil Krankenfahrten GmbH",
      contactName: "Anna Müller",
      email: "anna@mobil-kf.de",
      phone: "089 1234567",
      city: "München",
      serviceArea: "München & Umland",
      fleetSize: 5,
      notes: "Spezialisiert auf liegende Krankentransporte.",
      status: "freigegeben",
      ratePerRide: FEE_PER_RIDE,
      createdAt: iso(28),
    },
    {
      id: uid(),
      company: "RehaTaxi Berlin UG",
      contactName: "Tobias Schneider",
      email: "kontakt@rehataxi-berlin.de",
      phone: "030 9876543",
      city: "Berlin",
      serviceArea: "Berlin Mitte & Charlottenburg",
      fleetSize: 8,
      notes: "Rollstuhlgerechte Fahrzeuge verfügbar.",
      status: "freigegeben",
      ratePerRide: FEE_PER_RIDE,
      createdAt: iso(21),
    },
    {
      id: uid(),
      company: "Sani-Fahrt Hamburg",
      contactName: "Petra Lange",
      email: "info@sani-fahrt-hh.de",
      phone: "040 5551122",
      city: "Hamburg",
      serviceArea: "Hamburg Nord",
      fleetSize: 3,
      notes: "",
      status: "ausstehend",
      ratePerRide: FEE_PER_RIDE,
      createdAt: iso(2),
    },
    {
      id: uid(),
      company: "FahrAktiv Köln e.K.",
      contactName: "Markus Wagner",
      email: "service@fahraktiv-koeln.de",
      phone: "0221 333444",
      city: "Köln",
      serviceArea: "Köln & Bonn",
      fleetSize: 12,
      notes: "Dialyse-Fahrten als Schwerpunkt.",
      status: "ausstehend",
      ratePerRide: FEE_PER_RIDE,
      createdAt: iso(1),
    },
  ]

  const [p1, p2] = sampleProviders
  const samplePayments: Payment[] = [
    {
      id: uid(),
      providerId: p1.id,
      amount: 84,
      rides: 42,
      period: "Januar 2026",
      status: "bezahlt",
      dueDate: dueIso(-10),
      createdAt: iso(20),
      paidAt: iso(12),
    },
    {
      id: uid(),
      providerId: p1.id,
      amount: 116,
      rides: 58,
      period: "Februar 2026",
      status: "offen",
      dueDate: dueIso(7),
      createdAt: iso(5),
      paidAt: null,
    },
    {
      id: uid(),
      providerId: p2.id,
      amount: 150,
      rides: 75,
      period: "Januar 2026",
      status: "ueberfaellig",
      dueDate: dueIso(-3),
      createdAt: iso(18),
      paidAt: null,
    },
  ]

  write(PROVIDERS_KEY, [...sampleProviders, ...read<Provider[]>(PROVIDERS_KEY, [])])
  write(PAYMENTS_KEY, [...samplePayments, ...read<Payment[]>(PAYMENTS_KEY, [])])
  return { providers: sampleProviders.length, payments: samplePayments.length }
}

export function clearPlatformData() {
  write(PROVIDERS_KEY, [])
  write(PAYMENTS_KEY, [])
}

// --- Admin "auth" (demo only, NOT secure) ----------------------------------

export function hasAdminAccount(): boolean {
  return read<string | null>(ADMIN_PW_KEY, null) !== null
}

export function registerAdmin(password: string): { ok: boolean; error?: string } {
  if (password.length < 6) return { ok: false, error: "Das Passwort muss mindestens 6 Zeichen lang sein." }
  if (hasAdminAccount()) return { ok: false, error: "Es existiert bereits ein Konto." }
  write(ADMIN_PW_KEY, password)
  setSession(true)
  return { ok: true }
}

export function loginAdmin(password: string): { ok: boolean; error?: string } {
  const stored = read<string | null>(ADMIN_PW_KEY, null)
  if (stored === null) return { ok: false, error: "Kein Konto vorhanden. Bitte zuerst registrieren." }
  if (stored !== password) return { ok: false, error: "Falsches Passwort." }
  setSession(true)
  return { ok: true }
}

export function logoutAdmin() {
  setSession(false)
}

function setSession(active: boolean) {
  if (!isBrowser()) return
  write(SESSION_KEY, active) // ensure consistent JSON serialization
}

export function isLoggedIn(): boolean {
  return read<boolean>(SESSION_KEY, false) === true
}

// --- React hooks -----------------------------------------------------------

// Client hooks use a mounted-flag pattern: they render empty/false on the
// server and during the first client render (to match the prerendered HTML),
// then read from localStorage in an effect after mount and re-render on every
// store change. This avoids SSR/hydration snapshot mismatches.

function useStoreValue<T>(getValue: () => T, initial: T): T {
  const [value, setValue] = useState<T>(initial)
  useEffect(() => {
    setValue(getValue())
    return subscribe(() => setValue(getValue()))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return value
}

const EMPTY_BOOKINGS: Booking[] = []
const EMPTY_DRIVERS: Driver[] = []

export function useBookings(): Booking[] {
  return useStoreValue(getBookings, EMPTY_BOOKINGS)
}

export function useDrivers(): Driver[] {
  return useStoreValue(getDrivers, EMPTY_DRIVERS)
}

export function usePricing(): Pricing {
  return useStoreValue(getPricing, DEFAULT_PRICING)
}

export function useTracking(bookingId: string): TrackingState | null {
  return useStoreValue(() => getTracking(bookingId), null)
}

export function useAuthState(): { loggedIn: boolean; hasAccount: boolean } {
  return useStoreValue(
    () => ({ loggedIn: isLoggedIn(), hasAccount: hasAdminAccount() }),
    { loggedIn: false, hasAccount: false },
  )
}

const EMPTY_PROVIDERS: Provider[] = []
const EMPTY_PAYMENTS: Payment[] = []

export function useProviders(): Provider[] {
  return useStoreValue(getProviders, EMPTY_PROVIDERS)
}

export function usePayments(): Payment[] {
  return useStoreValue(getPayments, EMPTY_PAYMENTS)
}

export function usePlatformAuthState(): { loggedIn: boolean; hasAccount: boolean } {
  return useStoreValue(
    () => ({ loggedIn: isPlatformLoggedIn(), hasAccount: hasPlatformAccount() }),
    { loggedIn: false, hasAccount: false },
  )
}

export function useDriverAuth(): { driver: Driver | null } {
  return useStoreValue(() => ({ driver: getCurrentDriver() }), { driver: null })
}

const EMPTY_PW_MAP: Record<string, string> = {}

export function useDriverPasswords(): Record<string, string> {
  return useStoreValue(getDriverPasswords, EMPTY_PW_MAP)
}
