import Link from "next/link"
import { ArrowLeft } from "lucide-react"

type BookingHeaderProps = {
  accent: "gkv" | "privat"
  eyebrow: string
  title: string
  description: string
}

export function BookingHeader({ accent, eyebrow, title, description }: BookingHeaderProps) {
  const isGkv = accent === "gkv"
  return (
    <header className="mb-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Zurück zur Auswahl
      </Link>
      <p
        className={
          isGkv
            ? "mt-6 text-sm font-semibold uppercase tracking-wide text-emerald-600"
            : "mt-6 text-sm font-semibold uppercase tracking-wide text-red-600"
        }
      >
        {eyebrow}
      </p>
      <h1 className="mt-1 text-balance text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">{description}</p>
    </header>
  )
}
