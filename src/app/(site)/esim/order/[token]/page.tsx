import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/site/Container";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildWhatsAppLink } from "@/lib/contact";
import { getDestinationByIso } from "@/lib/esim-config";
import type { Esim } from "@/lib/megaesim";
import { OrderPoller, CopyButton } from "./OrderClientComponents";

// noindex, no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "eSIM Order Status & Installation | Masaar Holidays",
  robots: {
    index: false,
    follow: false,
  },
};

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function CheckCircleIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function ClockIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function XCircleIcon({ className = "size-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  );
}

function AppleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.64-.78 1.08-1.86.96-2.95-1 .04-2.14.67-2.8 1.44-.58.67-1.1 1.77-.96 2.83 1.12.09 2.2-.59 2.8-1.32" />
    </svg>
  );
}

function AndroidIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85 1.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.97 4.26 6 6.01 6 8h12c0-1.99-.97-3.75-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z" />
    </svg>
  );
}

export default async function EsimOrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const publicToken = token?.trim();

  if (!publicToken) {
    notFound();
  }

  const supabase = createAdminClient();

  // Look up by public_token on the server only.
  // NEVER select stripe_session_id, stripe_payment_intent, or internal cost fields.
  const { data: order, error: orderError } = await supabase
    .from("esim_orders")
    .select(
      "id, partner_ref, plan_id, quantity, customer_name, customer_email, payment_status, fulfilment_status, expected_amount_minor, charged_amount_minor, charge_currency, created_at, esims, needs_attention, fulfilment_error, presentment_currency, presentment_amount_minor, vat_amount_minor, vat_rate_pct, vat_trn, invoice_number"
    )
    .eq("public_token", publicToken)
    .maybeSingle();

  if (orderError || !order) {
    notFound();
  }

  // Look up plan details
  const { data: plan } = await supabase
    .from("esim_plans")
    .select("name, country_iso, region_slug, data_gb, validity_days, is_unlimited, network_type")
    .eq("plan_id", order.plan_id)
    .maybeSingle();

  const destination = plan?.country_iso ? getDestinationByIso(plan.country_iso) : null;
  const destinationName = destination?.name || plan?.region_slug || "Travel";
  const destinationFlag = destination?.flag || "🌐";

  const isPaid = order.payment_status === "paid";
  const isRefunded = order.payment_status === "refunded";
  const isPaymentFailed = order.payment_status === "failed";
  const isPending = order.payment_status === "pending";

  const isCompleted = order.fulfilment_status === "completed";
  const isProcessing = order.fulfilment_status === "processing" || (isPaid && order.fulfilment_status === "pending");
  const isFulfilmentFailed = order.fulfilment_status === "failed";

  // Polling condition: poll every 5s while processing or pending payment
  const shouldPoll = isProcessing || isPending;

  const currency = (order.charge_currency || "aed").toUpperCase();
  const amountMinor = order.charged_amount_minor || order.expected_amount_minor || 0;
  const formattedCharged = (amountMinor / 100).toFixed(2);

  // Adaptive pricing: local currency paid by customer if different from charged currency
  const hasPresentment = Boolean(
    order.presentment_currency &&
    order.presentment_amount_minor &&
    order.presentment_currency.toLowerCase() !== (order.charge_currency || "aed").toLowerCase()
  );
  const presentmentText = hasPresentment
    ? `${order.presentment_currency!.toUpperCase()} ${(order.presentment_amount_minor! / 100).toFixed(2)}`
    : null;

  // VAT calculations
  const hasVat = Boolean(order.vat_amount_minor && order.vat_amount_minor > 0);
  const vatAmountMinor = order.vat_amount_minor || 0;
  const vatRatePct = order.vat_rate_pct || 5;
  const netAmountMinor = amountMinor - vatAmountMinor;

  // Parse esims array
  const esims: Esim[] = Array.isArray(order.esims) ? (order.esims as unknown as Esim[]) : [];

  // WhatsApp assistance link
  const whatsAppHelpMessage = `Assalamu Alaikum, I have an enquiry regarding my eSIM order ${order.partner_ref}.`;
  const whatsAppHelpUrl = buildWhatsAppLink(whatsAppHelpMessage);

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-10 sm:py-16">
      <Container>
        <div className="mx-auto max-w-2xl">
          {/* Client-side poller for active provisioning (stops after 10m or completion) */}
          <OrderPoller
            shouldPoll={shouldPoll}
            whatsAppUrl={whatsAppHelpUrl}
            createdAt={order.created_at}
          />

          {/* Breadcrumb path */}
          <div className="mb-6">
            <Breadcrumbs
              items={[
                { label: "eSIM", href: "/esim" },
                { label: "Order Status" },
                { label: order.partner_ref },
              ]}
            />
          </div>

          {/* Main Status Card */}
          <div className="overflow-hidden rounded-3xl border border-black/10 bg-white shadow-sm">
            {/* Header Banner based on status */}
            <div
              className={`p-6 sm:p-8 text-center border-b ${
                isCompleted
                  ? "bg-emerald-50/70 border-emerald-100"
                  : isRefunded
                  ? "bg-amber-50/70 border-amber-100"
                  : isProcessing
                  ? "bg-sky-50/70 border-sky-100"
                  : isPaymentFailed || isFulfilmentFailed
                  ? "bg-red-50/70 border-red-100"
                  : "bg-amber-50/70 border-amber-100"
              }`}
            >
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white shadow-xs">
                {isCompleted && <CheckCircleIcon className="size-8 text-emerald-600" />}
                {isRefunded && <ClockIcon className="size-8 text-amber-600" />}
                {isProcessing && (
                  <div className="relative flex items-center justify-center">
                    <div className="size-8 animate-spin rounded-full border-3 border-sky-200 border-t-sky-600" />
                  </div>
                )}
                {(isPaymentFailed || (isFulfilmentFailed && !isRefunded)) && (
                  <XCircleIcon className="size-8 text-red-600" />
                )}
                {isPending && !isProcessing && <ClockIcon className="size-8 text-amber-600 animate-pulse" />}
              </div>

              <div className="mt-4">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                    isCompleted
                      ? "bg-emerald-100 text-emerald-800"
                      : isRefunded
                      ? "bg-amber-100 text-amber-800"
                      : isProcessing
                      ? "bg-sky-100 text-sky-800"
                      : isPaymentFailed || isFulfilmentFailed
                      ? "bg-red-100 text-red-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {isCompleted && "eSIM Ready for Installation"}
                  {isRefunded && "Payment Refunded"}
                  {isProcessing && "Activating Your eSIM"}
                  {isFulfilmentFailed && !isRefunded && "Provisioning In Review"}
                  {isPaymentFailed && "Payment Unsuccessful"}
                  {isPending && !isProcessing && "Payment Pending"}
                </span>
              </div>

              <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#0A0A08] sm:text-3xl">
                {isCompleted && "Your Travel eSIM is Ready"}
                {isRefunded && "Order Refunded Successfully"}
                {isProcessing && "Allocating Your Digital Profile"}
                {isFulfilmentFailed && !isRefunded && "Order In Review by Concierge"}
                {isPaymentFailed && "Payment Could Not Be Completed"}
                {isPending && !isProcessing && "Verifying Your Payment"}
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-xs sm:text-sm text-[#0A0A08]/75 leading-relaxed">
                {isCompleted &&
                  `Thank you, ${order.customer_name || "valued traveller"}. Scan the QR code or tap Direct Install below to activate your connection.`}
                {isRefunded &&
                  "A full refund has been credited back to your original payment method. Depending on your bank, it will appear in 3–7 business days."}
                {isProcessing &&
                  "We have received your payment and are provisioning your carrier profiles. This page will update automatically in a few seconds."}
                {isFulfilmentFailed && !isRefunded &&
                  "Our automated carrier system encountered a temporary provisioning hold. Our concierge team has been alerted and will finalize your profiles shortly."}
                {isPaymentFailed &&
                  "We were unable to charge your payment method. No funds were debited from your account. You can return to our catalogue to retry."}
                {isPending && !isProcessing &&
                  "We have received your order request and are awaiting settlement from your card issuer. This page updates automatically."}
              </p>
            </div>

            {/* Order Details Body */}
            <div className="p-6 sm:p-8 space-y-6">
              {/* Order Reference Box */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[#FAF7F2] p-4 sm:p-5">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0A0A08]/50">
                    Order Reference
                  </span>
                  <div className="font-mono text-lg font-bold text-[#0A0A08] tracking-wide">
                    {order.partner_ref}
                  </div>
                  {order.invoice_number && (
                    <div className="text-[11px] font-medium text-[#8F6407] mt-0.5">
                      Receipt #: {order.invoice_number}
                    </div>
                  )}
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0A0A08]/50">
                    {isRefunded ? "Amount Refunded" : "Total Paid"}
                  </span>
                  <div className="text-lg font-bold text-[#0A0A08]">
                    {hasPresentment ? presentmentText : `${currency} ${formattedCharged}`}
                  </div>
                  {hasPresentment && (
                    <div className="text-[11px] text-[#0A0A08]/60">
                      Settled as {currency} ${formattedCharged}
                    </div>
                  )}
                  {hasVat && (
                    <div className="text-[11px] font-semibold text-[#8F6407] mt-0.5">
                      Price includes {vatRatePct}% VAT
                    </div>
                  )}
                </div>
              </div>

              {/* COMPLETED STATUS: PER-eSIM DELIVERY PROFILES */}
              {isCompleted && esims.length > 0 && (
                <div className="space-y-6">
                  <div className="border-b border-black/10 pb-2">
                    <h2 className="text-base font-bold text-[#0A0A08]">
                      Your eSIM {esims.length === 1 ? "Profile" : "Profiles"} ({esims.length})
                    </h2>
                    <p className="text-xs text-[#0A0A08]/60 mt-0.5">
                      Install on Wi-Fi now; validity starts only upon connecting to a local mobile network abroad.
                    </p>
                  </div>

                  {order.customer_email && (
                    <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs text-emerald-900">
                      <span className="text-base">✉️</span>
                      <span>
                        A copy of your activation QR codes and setup instructions has been sent to{" "}
                        <strong className="underline decoration-emerald-400">{order.customer_email}</strong>.
                      </span>
                    </div>
                  )}

                  {esims.map((unit, index) => {
                    const lpa = unit.lpa || "";
                    const appleInstallUrl = `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(
                      lpa
                    )}`;
                    const androidInstallUrl = `https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(
                      lpa
                    )}`;

                    return (
                      <div
                        key={unit.iccid || index}
                        className="overflow-hidden rounded-2xl border border-[#C9A227]/40 bg-white p-5 sm:p-6 shadow-xs space-y-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/5 pb-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#8F6407]">
                            Profile {index + 1} of {esims.length}
                          </span>
                          {unit.iccid && (
                            <span className="font-mono text-[11px] text-[#0A0A08]/60">
                              ICCID: {unit.iccid}
                            </span>
                          )}
                        </div>

                        {/* QR Code and Direct Install */}
                        <div className="flex flex-col items-center justify-center text-center space-y-4">
                          {unit.qr_url ? (
                            <div className="relative rounded-2xl border-4 border-[#FAF7F2] bg-white p-3 shadow-xs">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={unit.qr_url}
                                alt={`eSIM Activation QR Code for ${order.partner_ref}`}
                                className="size-48 sm:size-56 object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex size-48 sm:size-56 items-center justify-center rounded-2xl border border-dashed border-black/20 bg-[#FAF7F2] text-xs text-[#0A0A08]/50">
                              QR Code allocating...
                            </div>
                          )}

                          <p className="text-xs text-[#0A0A08]/70 max-w-sm">
                            Point your phone camera or go to{" "}
                            <strong>Settings &gt; Cellular &gt; Add eSIM</strong> to scan.
                          </p>

                          {/* One-Tap Install Links */}
                          {lpa && (
                            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                              <a
                                href={appleInstallUrl}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#0A0A08] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-black/80 active:scale-95"
                              >
                                <AppleIcon className="size-4" />
                                Direct Install on iPhone
                              </a>
                              <a
                                href={androidInstallUrl}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#C9A227] px-4 py-2.5 text-xs font-bold text-[#0A0A08] shadow-xs transition hover:bg-[#b59120] active:scale-95"
                              >
                                <AndroidIcon className="size-4" />
                                Direct Install on Android
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Manual LPA Code Fallback */}
                        {lpa && (
                          <div className="rounded-xl border border-black/10 bg-[#FAF7F2] p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F6407]">
                                Manual Activation Code (LPA String)
                              </span>
                              <CopyButton text={lpa} label="Copy LPA Code" />
                            </div>
                            <div className="rounded-lg border border-black/10 bg-white p-2.5 font-mono text-xs text-[#0A0A08] break-all select-all">
                              {lpa}
                            </div>
                            <p className="text-[11px] text-[#0A0A08]/50">
                              If camera scanning is unavailable, choose &quot;Enter Details Manually&quot; in Cellular settings and paste this code.
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Installation Instructions */}
                  <div className="rounded-2xl border border-black/10 bg-[#FAF7F2] p-5 sm:p-6 space-y-3">
                    <h3 className="text-sm font-bold text-[#0A0A08] flex items-center gap-2">
                      <span>📱</span> Simple Installation Steps
                    </h3>
                    <ol className="list-decimal pl-5 text-xs text-[#0A0A08]/80 space-y-2 leading-relaxed">
                      <li>
                        <strong>Install on Wi-Fi:</strong> Connect to stable Wi-Fi at home, hotel, or airport before departing.
                      </li>
                      <li>
                        <strong>Scan or Tap:</strong> Use the QR code or tap the Direct Install button for your device. Follow the on-screen prompts to add the cellular plan.
                      </li>
                      <li>
                        <strong>Label the Line:</strong> Name the new line <em>Masaar Travel</em> or your destination country so it is easily identifiable.
                      </li>
                      <li>
                        <strong>Turn on Data Roaming upon Arrival:</strong> When you land at your destination, switch mobile data to this eSIM line and toggle <strong>Data Roaming: ON</strong>.
                      </li>
                      <li className="text-[#8F6407] font-medium">
                        <strong>Validity starts when connected:</strong> Your plan&apos;s validity days begin only when the eSIM first connects to a supported local network abroad.
                      </li>
                    </ol>
                  </div>
                </div>
              )}

              {/* PROCESSING STATUS NOTICE */}
              {isProcessing && (
                <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 sm:p-6 space-y-3 text-center">
                  <div className="inline-flex size-10 items-center justify-center rounded-full bg-sky-100 text-sky-700 mx-auto">
                    <ClockIcon className="size-5" />
                  </div>
                  <h2 className="text-sm font-bold text-sky-950">
                    Allocating Carrier Profile...
                  </h2>
                  <p className="text-xs text-sky-900/80 max-w-md mx-auto leading-relaxed">
                    We are registering your eSIM with global telecom carriers. Your QR code and manual activation code will render on this screen automatically within a few moments.
                  </p>
                  <p className="text-[11px] text-sky-800/60 font-medium">
                    Auto-refreshing every 5 seconds...
                  </p>
                </div>
              )}

              {/* FAILED / ATTENTION NOTICE */}
              {isFulfilmentFailed && !isRefunded && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 sm:p-6 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <ClockIcon className="size-5 shrink-0" />
                    <h2 className="text-sm font-bold">
                      Concierge Support Assigned
                    </h2>
                  </div>
                  <p className="text-xs text-amber-950/80 leading-relaxed">
                    Our team in Dubai has been notified to ensure your digital profile is activated without delay. Your payment is secure and your order reference is{" "}
                    <strong>{order.partner_ref}</strong>.
                  </p>
                </div>
              )}

              {/* Item Summary Strip */}
              <div className="divide-y divide-black/5 rounded-2xl border border-black/10 p-5 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0A08]/60 pb-1">
                  Item Details
                </h3>

                <div className="flex items-start justify-between text-xs sm:text-sm pt-3">
                  <div>
                    <div className="font-bold text-[#0A0A08]">
                      {plan?.name || "Prepaid Travel eSIM"}
                    </div>
                    <div className="text-xs text-[#0A0A08]/60 mt-0.5">
                      {destinationFlag} {destinationName} ·{" "}
                      {plan?.is_unlimited ? "Unlimited Data" : `${plan?.data_gb} GB`} ·{" "}
                      {plan?.validity_days} Days
                    </div>
                  </div>
                  <div className="font-semibold text-[#0A0A08]">
                    Qty: {order.quantity}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3">
                  <span className="text-[#0A0A08]/60">Recipient Email</span>
                  <span className="font-medium text-[#0A0A08]">{order.customer_email}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-3">
                  <span className="text-[#0A0A08]/60">Order Date</span>
                  <span className="font-medium text-[#0A0A08]">
                    {new Date(order.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                {hasVat && (
                  <div className="pt-3 text-xs space-y-2 border-t border-black/5">
                    <div className="flex justify-between text-[#0A0A08]/70">
                      <span>Subtotal (excl. VAT)</span>
                      <span className="font-medium text-[#0A0A08]">{currency} {(netAmountMinor / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#0A0A08]/70">
                      <span>VAT ({vatRatePct}%)</span>
                      <span className="font-medium text-[#0A0A08]">{currency} {(vatAmountMinor / 100).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#0A0A08] font-bold">
                      <span>Total (incl. VAT)</span>
                      <span>{currency} {formattedCharged}</span>
                    </div>
                    {order.vat_trn && (
                      <div className="flex justify-between text-[11px] text-[#0A0A08]/60 pt-1 border-t border-black/5">
                        <span>Tax Registration Number (TRN)</span>
                        <span className="font-mono">{order.vat_trn}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* WhatsApp Concierge Assistance */}
              <div className="rounded-2xl border border-black/10 bg-[#FAF7F2] p-5 text-center sm:p-6 space-y-3">
                <h3 className="text-sm font-bold text-[#0A0A08]">
                  Need Assistance With Your Order?
                </h3>
                <p className="text-xs text-[#0A0A08]/70 max-w-md mx-auto leading-relaxed">
                  Our team in Dubai is available 24/7 on WhatsApp to assist with setup, device verification, or travel queries.
                </p>
                <div className="pt-1">
                  <a
                    href={whatsAppHelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#20bd5a]"
                  >
                    <WhatsAppIcon className="size-4" />
                    Help on WhatsApp
                  </a>
                </div>
              </div>

              {/* Back to catalogue button */}
              <div className="text-center pt-2">
                <Link
                  href="/esim"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#8F6407] hover:text-[#0A0A08] transition"
                >
                  ← Browse More eSIM Destinations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
