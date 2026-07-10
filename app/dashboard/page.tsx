"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { useAuthState } from "@/lib/store"
import { DashboardLoginForm } from "@/components/dashboard-login-form"
import { AdminDashboard, DashboardHeader } from "@/components/admin-dashboard"

export default function DashboardPage() {
  const { loggedIn } = useAuthState()

  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Zurück zur Buchung
          </Link>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <header className="mb-6 text-center">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Krankenfahrdienst Dashboard</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Melden Sie sich an, um Fahrten und Buchungen zu verwalten.
              </p>
            </header>

            <DashboardLoginForm />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <DashboardHeader />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <AdminDashboard />
      </div>
    </main>
  )
}
