import { PrivatBookingForm } from "@/components/privat-booking-form"
import { BookingHeader } from "@/components/booking-header"

export default function PrivatBookingPage() {
  return (
    <main className="min-h-screen bg-muted/40 px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <BookingHeader
          accent="privat"
          eyebrow="Privat / Selbstzahler"
          title="Fahrt direkt buchen"
          description="Geben Sie Ihre Fahrtdaten ein — Sie erhalten sofort einen transparenten Festpreis."
        />
        <PrivatBookingForm />
      </div>
    </main>
  )
}
