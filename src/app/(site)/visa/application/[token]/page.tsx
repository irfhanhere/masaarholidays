import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getVisaApplicationByToken } from "@/lib/data/visa";
import { VisaTrackingView } from "@/components/site/VisaTrackingView";
import { Container } from "@/components/site/Container";
import { buildPageMetadata } from "@/lib/i18n";
import { CONTACT } from "@/lib/contact";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const { application } = await getVisaApplicationByToken(token);

  const refTitle = application ? `Application ${application.reference_no}` : "Visa Application Tracking";

  return buildPageMetadata({
    path: `/visa/application/${token}`,
    title: `${refTitle} Status & Tracking | Masaar Holidays`,
    description: "Track your Masaar Holidays visa application progress in real time.",
    noindex: true,
  });
}

export default async function VisaApplicationTrackingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { application, applicants, documents, payments } = await getVisaApplicationByToken(token);

  if (!application) {
    const whatsappUrl = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
      `Hello Masaar Holidays, I am trying to track my visa application with code: ${token}. Could you please assist me?`
    )}`;

    return (
      <div className="min-h-screen bg-warm-ivory/30 pb-24 text-masaar-black">
        <div className="border-b border-black/5 bg-warm-ivory/60 py-2.5">
          <Container>
            <div className="flex items-center gap-2 text-xs text-masaar-black/60">
              <Link href="/" className="hover:text-masaar-black">Home</Link>
              <span>›</span>
              <Link href="/visa" className="hover:text-masaar-black">Visa</Link>
              <span>›</span>
              <span className="font-medium text-masaar-black">Application Lookup</span>
            </div>
          </Container>
        </div>

        <section className="bg-masaar-black py-12 text-white text-center">
          <Container>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
              — VISA TRACKING PORTAL —
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-4xl">
              Application Status
            </h1>
          </Container>
        </section>

        <Container className="mt-10">
          <div className="mx-auto max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            <h2 className="mt-4 font-semibold text-masaar-black text-lg">
              Application Not Found or Link Expired
            </h2>

            <p className="mt-2 text-xs leading-relaxed text-masaar-black/70">
              We could not find an active visa application matching the code:
            </p>
            <p className="mt-1 inline-block rounded bg-neutral-100 px-3 py-1 font-mono text-xs font-medium text-masaar-black break-all">
              {token}
            </p>

            <p className="mt-4 text-xs leading-relaxed text-masaar-black/60">
              If your application was recently submitted or you were provided an application reference number (e.g. MH-SV-...), you can look it up directly using our Reference Lookup portal.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/visa/tracking"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md bg-masaar-black px-5 py-2.5 text-xs font-semibold text-white shadow hover:bg-black/85"
              >
                Search by Reference Number →
              </Link>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-md border border-emerald-600 bg-emerald-50 px-5 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
              >
                WhatsApp Support
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-black/5">
              <Link href="/visa" className="text-xs text-masaar-black/60 hover:text-masaar-black underline">
                Back to Visa Services
              </Link>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-warm-ivory/30 py-24 text-center">
          <p className="text-sm text-masaar-black/60">Loading application details...</p>
        </div>
      }
    >
      <VisaTrackingView
        application={application}
        applicants={applicants}
        documents={documents}
        payments={payments}
      />
    </Suspense>
  );
}
