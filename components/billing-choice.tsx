import Link from "next/link"
import { ArrowRight, Check, CreditCard, Home } from "lucide-react"

type Option = {
  href: string
  accent: "gkv" | "privat"
  icon: typeof Home
  title: string
  badge: string
  subtitle: string
  features: string[]
  cta: string
}

const options: Option[] = [
  {
    href: "/buchung/gkv",
    accent: "gkv",
    icon: Home,
    title: "Gesetzlich versichert",
    badge: "GKV",
    subtitle: "Mit ärztlicher Verordnung (Transportschein)",
    features: ["Kostenübernahme durch Kasse", "Muster 4 / Genehmigungsprüfung", "Eigenanteil ggf. 5–10 €"],
    cta: "Diesen Weg wählen",
  },
  {
    href: "/buchung/privat",
    accent: "privat",
    icon: CreditCard,
    title: "Privat / Selbstzahler",
    badge: "Privat",
    subtitle: "Direkt buchen und bezahlen",
    features: ["Sofortige Preisberechnung", "Keine Genehmigung nötig", "Transparente Festpreise"],
    cta: "Diesen Weg wählen",
  },
]

export function BillingChoice() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {options.map((option) => {
        const isGkv = option.accent === "gkv"
        const Icon = option.icon
        return (
          <Link
            key={option.href}
            href={option.href}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm outline-none transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div className={isGkv ? "h-1.5 w-full bg-emerald-500" : "h-1.5 w-full bg-red-500"} />
            <div className="flex flex-1 flex-col gap-5 p-6">
              <span
                className={
                  isGkv
                    ? "flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                    : "flex size-12 items-center justify-center rounded-xl bg-red-50 text-red-600"
                }
              >
                <Icon className="size-6" aria-hidden="true" />
              </span>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{option.title}</h2>
                  <span
                    className={
                      isGkv
                        ? "rounded-full border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700"
                        : "rounded-full border border-red-200 px-2 py-0.5 text-xs font-medium text-red-700"
                    }
                  >
                    {option.badge}
                  </span>
                </div>
                <p className="mt-1 text-sm italic text-muted-foreground">{option.subtitle}</p>
              </div>

              <ul className="flex flex-col gap-3">
                {option.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                    <Check
                      className={isGkv ? "size-4 shrink-0 text-emerald-500" : "size-4 shrink-0 text-red-500"}
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <div
                className={
                  isGkv
                    ? "mt-auto flex items-center justify-between rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition group-hover:bg-emerald-100"
                    : "mt-auto flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition group-hover:bg-red-100"
                }
              >
                {option.cta}
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
