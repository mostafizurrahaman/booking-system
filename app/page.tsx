import Link from "next/link"
import { LogIn, ShieldCheck, Building2, Car } from "lucide-react"
import { BillingChoice } from "@/components/billing-choice"

export default function Page() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8 flex flex-wrap justify-end gap-2">
          <Link
            href="/registrieren"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Building2 className="size-4" aria-hidden="true" />
            Als Fahrdienst registrieren
          </Link>
          <Link
            href="/fahrer"
            className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm outline-none transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Car className="size-4" aria-hidden="true" />
            Fahrer-Login
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm outline-none transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <LogIn className="size-4" aria-hidden="true" />
            Fahrdienst-Login
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm outline-none transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            Admin
          </Link>
        </div>

        <header className="mb-10 text-center">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Wie möchten Sie die Fahrt abrechnen?
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Wählen Sie Ihren Versicherungsstatus — wir führen Sie durch den passenden Buchungsweg.
          </p>
        </header>

        <BillingChoice />
      </div>
    </main>
  )
}
