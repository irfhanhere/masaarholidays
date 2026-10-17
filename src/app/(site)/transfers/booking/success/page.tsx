import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { createAdminClient } from "@/lib/supabase/admin";
import { CONTACT, buildWhatsAppLink } from "@/lib/contact";
import type { TransferBookingRow } from "@/lib/types/database";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Transfer Booking Confirmed | Masaar Holidays",
  description: "Your private transfer in Saudi Arabia has been booked and confirmed.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function TransferBookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; session_id?: string }>;
}) {
  const { token, session_id } = await searchParams;

  if (!token && !session_id) {
    notFound();
  }

  const supabase = createAdminClient();
  let query = supabase.from("transfer_bookings").select("*");

  if (token) {
    query = query.eq("public_token", token);
  } else if (session_id) {
    query = query.eq("stripe_session_id", session_id);
  }

  const { data: booking, error } = await query.maybeSingle<TransferBookingRow>();

  if (error || !booking) {
    notFound();
  }

  const isPaid = booking.payment_status === "paid";
  const formattedAmount = (booking.charged_amount_minor / 100).toFixed(2);

  const whatsappInquiryUrl = buildWhatsAppLink(
    `Assalamu Alaikum Masaar Holidays,\nI have confirmed private transfer booking: ${booking.booking_ref} (${booking.route_name}) on ${booking.travel_date}.\nPlease assist me with driver and pickup updates.\nJazakAllah Khair.`
  );

  return (
    <div className="min-h-screen bg-warm-ivory/20 pb-20 pt-8">
      <Container className="max-w-4xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Transfers", href: "/transfers" },
            { label: booking.route_name, href: `/transfers/${booking.route_slug}` },
            { label: "Booking Confirmation" },
          ]}
        />

        {/* Confirmation Card */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          {/* Header Banner */}
          <div className="bg-masaar-black px-6 py-8 text-center text-white sm:px-10">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40">
              <svg className="size-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-deep-gold">
              Booking {isPaid ? "Confirmed & Paid" : "Received"}
            </span>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Your Private Transfer is Booked!</h1>
            <p className="mt-2 text-xs text-white/70 max-w-md mx-auto">
              A full booking confirmation and receipt has been sent to <strong>{booking.customer_email}</strong>.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-xs">
              <span className="text-white/60">Booking Reference:</span>
              <span className="font-mono font-bold tracking-wider text-white text-sm">{booking.booking_ref}</span>
            </div>
          </div>

          <div className="p-6 sm:p-10 space-y-8">
            {/* Journey Summary Box */}
            <div className="rounded-xl border border-black/10 bg-warm-ivory/30 p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-masaar-black border-b border-black/10 pb-3">
                Transfer &amp; Schedule Details
              </h2>

              <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 text-xs">
                <div>
                  <dt className="text-masaar-black/60 font-medium">Route</dt>
                  <dd className="font-bold text-masaar-black text-sm mt-0.5">{booking.route_name}</dd>
                </div>

                <div>
                  <dt className="text-masaar-black/60 font-medium">Vehicle Category</dt>
                  <dd className="font-bold text-masaar-black text-sm mt-0.5">
                    {booking.vehicle_name} ({booking.model_year || "2023–2026"})
                  </dd>
                </div>

                <div>
                  <dt className="text-masaar-black/60 font-medium">Travel Date &amp; Pickup Time</dt>
                  <dd className="font-bold text-masaar-black mt-0.5">
                    {booking.travel_date} at {booking.pickup_time}
                  </dd>
                </div>

                <div>
                  <dt className="text-masaar-black/60 font-medium">Travel Party</dt>
                  <dd className="font-bold text-masaar-black mt-0.5">
                    {booking.passengers} Passenger{booking.passengers > 1 ? "s" : ""}, {booking.suitcases || "0"} Suitcases
                  </dd>
                </div>

                {booking.flight_number && (
                  <div>
                    <dt className="text-masaar-black/60 font-medium">Flight Number</dt>
                    <dd className="font-bold text-masaar-black uppercase mt-0.5">{booking.flight_number}</dd>
                  </div>
                )}

                <div>
                  <dt className="text-masaar-black/60 font-medium">Pickup Location</dt>
                  <dd className="font-medium text-masaar-black mt-0.5">{booking.pickup_location}</dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-masaar-black/60 font-medium">Drop-off Destination</dt>
                  <dd className="font-medium text-masaar-black mt-0.5">{booking.dropoff_location}</dd>
                </div>

                {booking.special_requests && (
                  <div className="sm:col-span-2">
                    <dt className="text-masaar-black/60 font-medium">Special Requests / Notes</dt>
                    <dd className="italic text-masaar-black/80 mt-0.5">{booking.special_requests}</dd>
                  </div>
                )}

                <div className="sm:col-span-2 border-t border-black/10 pt-3 flex justify-between items-center text-sm">
                  <dt className="font-semibold text-masaar-black">Payment Status</dt>
                  <dd className="font-bold text-emerald-700">
                    Paid ({formattedAmount} {booking.charge_currency})
                  </dd>
                </div>
              </dl>
            </div>

            {/* What to Expect Next */}
            <div className="rounded-xl border border-black/10 bg-white p-6 space-y-4">
              <h3 className="text-sm font-bold text-masaar-black">What Happens Next?</h3>
              <ol className="list-decimal list-inside space-y-2 text-xs text-masaar-black/70 leading-relaxed">
                <li>
                  <strong>Chauffeur Assignment:</strong> 12 to 24 hours prior to your scheduled pickup time, our operations team will dispatch your driver&apos;s name, phone number, and vehicle registration directly to your WhatsApp (<strong>{booking.customer_phone}</strong>).
                </li>
                <li>
                  <strong>Live Flight Tracking:</strong> For airport pickups, our dispatch monitors flight delays and gate arrivals automatically.
                </li>
                <li>
                  <strong>Airport Meet &amp; Greet:</strong> Your chauffeur will await you at the arrival terminal with a personalized Masaar greeting sign.
                </li>
              </ol>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-black/10 pt-6">
              <Link
                href="/transfers"
                className="text-xs font-semibold text-masaar-black/70 hover:text-masaar-black"
              >
                &larr; Back to Transfers Catalogue
              </Link>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#1EBE5D] transition-colors"
                >
                  <span>Chat with Dispatch on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
