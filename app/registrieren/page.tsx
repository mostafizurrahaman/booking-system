import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProviderRegistrationForm } from "@/components/provider-registration-form"

export default function RegisterProviderPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-12 sm:py-16">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Zur Startseite
        </Link>

        <header className="mb-8">
          <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Als Krankenfahrdienst registrieren
          </h1>
          <p className="mt-3 max-w-xl text-pretty leading-relaxed text-muted-foreground">
            Melden Sie Ihr Unternehmen an, um über die Plattform Fahrten zu erhalten. Nach der Prüfung durch den
            Betreiber wird Ihr Konto freigegeben. Die Vermittlungsprovision beträgt 2,00 € pro Fahrt.
          </p>
        </header>

        <ProviderRegistrationForm />
      </div>
    </main>
  )
}
