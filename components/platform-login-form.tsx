"use client"

import type React from "react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { Field, TextInput } from "@/components/form-fields"
import { loginPlatformAdmin, registerPlatformAdmin, usePlatformAuthState } from "@/lib/store"

export function PlatformLoginForm() {
  const { hasAccount } = usePlatformAuthState()
  const mode: "sign-in" | "sign-up" = hasAccount ? "sign-in" : "sign-up"
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = mode === "sign-up" ? registerPlatformAdmin(password) : loginPlatformAdmin(password)
    if (!res.ok) {
      setError(res.error ?? "Es ist ein Fehler aufgetreten.")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === "sign-up" ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          Erstmalige Einrichtung: Legen Sie Ihr Betreiber-Passwort fest. Es wird nur lokal in diesem Browser
          gespeichert.
        </p>
      ) : null}

      <Field label="Passwort" htmlFor="platform-password">
        <TextInput
          id="platform-password"
          name="password"
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
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
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm outline-none transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {mode === "sign-in" ? "Anmelden" : "Betreiber-Konto erstellen"}
      </button>
    </form>
  )
}
