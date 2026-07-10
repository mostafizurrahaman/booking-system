"use client"

import type React from "react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Field, TextInput } from "@/components/form-fields"
import { loginDriver } from "@/lib/store"

export function DriverLoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = loginDriver(email, password)
    if (!res.ok) {
      setError(res.error ?? "Es ist ein Fehler aufgetreten.")
      setLoading(false)
    }
    // Bei Erfolg rendert useDriverAuth im Parent das Dashboard.
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm leading-relaxed text-blue-800">
        Melden Sie sich mit Ihrer vom Fahrdienst hinterlegten E-Mail an. Bei der ersten Anmeldung legen Sie Ihr
        Passwort fest (mind. 6 Zeichen).
      </p>

      <Field label="E-Mail" htmlFor="email">
        <TextInput
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="fahrer@beispiel.de"
          required
        />
      </Field>

      <Field label="Passwort" htmlFor="password">
        <TextInput
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          minLength={6}
          required
        />
      </Field>

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm outline-none transition hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Anmelden
      </button>
    </form>
  )
}
