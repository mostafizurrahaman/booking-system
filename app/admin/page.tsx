"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { usePlatformAuthState } from "@/lib/store"
import { PlatformLoginForm } from "@/components/platform-login-form"
import { PlatformAdminDashboard, PlatformDashboardHeader } from "@/components/platform-admin-dashboard"

export default function AdminPage() {
  const { loggedIn } = usePlatformAuthState()

  if (!loggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Zur Startseite
          </Link>

          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <header className="mb-6 text-center">
              <h1 className="text-xl font-bold tracking-tight text-foreground">Betreiber-Administration</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Melden Sie sich an, um Registrierungen und Zahlungen zu verwalten.
              </p>
            </header>

            <PlatformLoginForm />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/40">
      <PlatformDashboardHeader />
      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <PlatformAdminDashboard />
      </div>
    </main>
  )
}
