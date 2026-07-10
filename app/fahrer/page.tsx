"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useDriverAuth } from "@/lib/store"
import { DriverLoginForm } from "@/components/driver-login-form"
import { DriverDashboard, DriverHeader } from "@/components/driver-dashboard"

export default function DriverPage() {
  const { driver } = useDriverAuth()

  if (!driver) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Zurück zur Startseite
          </Link>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <header className="mb-6 text-center">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Fahrer-Login</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Melden Sie sich an, um Fahrten anzunehmen und zu verwalten.
              </p>
            </header>

            <DriverLoginForm />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <DriverHeader driver={driver} />
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <DriverDashboard />
      </div>
    </main>
  )
}
