import { GkvBookingForm } from "@/components/gkv-booking-form"
import { BookingHeader } from "@/components/booking-header"

export default function GkvBookingPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <BookingHeader
          accent="gkv"
          eyebrow="Gesetzlich versichert (GKV)"
          title="Krankenfahrt mit Transportschein buchen"
          description="Bitte halten Sie Ihre Versichertenkarte und den ärztlichen Transportschein (Muster 4) bereit."
        />
        <GkvBookingForm />
      </div>
    </main>
  )
}
