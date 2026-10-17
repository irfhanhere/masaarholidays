"use client";

import { useState, useId } from "react";
import Link from "next/link";
import { Container } from "./Container";
import { useCurrency } from "./CurrencyProvider";
import { formatEsimPrice, convertFromUsd, CURRENCY_PREFIX } from "@/lib/currency";
import { buildWhatsAppLink } from "@/lib/contact";
import { getDestinationByIso } from "@/lib/esim-config";

export interface EsimCheckoutPlanData {
  plan_id: string;
  name: string;
  country_iso: string | null;
  region_slug: string | null;
  data_gb: number;
  validity_days: number;
  is_unlimited: boolean;
  network_type: string | null;
  carriers: unknown;
  fup_note: string | null;
  supports_hotspot: boolean | null;
  sale_price_usd: number;
}

interface EsimCheckoutClientProps {
  plan: EsimCheckoutPlanData;
  usdToAedRate: number;
  esimFxRates?: Record<string, number>;
  vatEnabled?: boolean;
  vatPct?: number;
}

function LockIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
    </svg>
  );
}

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function CheckIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

export function EsimCheckoutClient({
  plan,
  usdToAedRate,
  esimFxRates,
  vatEnabled = false,
  vatPct = 5,
}: EsimCheckoutClientProps) {
  const { currency, rates } = useCurrency();

  const [quantity, setQuantity] = useState<number>(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [phone, setPhone] = useState("");

  const [checkDeviceUnlocked, setCheckDeviceUnlocked] = useState(false);
  const [checkDataOnlyRefund, setCheckDataOnlyRefund] = useState(false);
  const [checkTermsPrivacy, setCheckTermsPrivacy] = useState(false);

  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const fullNameId = useId();
  const emailId = useId();
  const confirmEmailId = useId();
  const phoneId = useId();
  const honeypotId = useId();

  // 1. SessionStorage persistence: preserve form values across navigation and browser Back button
  const formStorageKey = `masaar_esim_checkout_${plan.plan_id}`;

  useState(() => {
    // Lazy initialisation from sessionStorage if running in browser
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem(formStorageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.fullName) setFullName(parsed.fullName);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.confirmEmail) setConfirmEmail(parsed.confirmEmail);
          if (parsed.phone) setPhone(parsed.phone);
          if (typeof parsed.quantity === "number") setQuantity(parsed.quantity);
          if (typeof parsed.checkDeviceUnlocked === "boolean") setCheckDeviceUnlocked(parsed.checkDeviceUnlocked);
          if (typeof parsed.checkDataOnlyRefund === "boolean") setCheckDataOnlyRefund(parsed.checkDataOnlyRefund);
          if (typeof parsed.checkTermsPrivacy === "boolean") setCheckTermsPrivacy(parsed.checkTermsPrivacy);
        }
      } catch {
        // Ignore parsing errors
      }
    }
  });

  // Save form fields to sessionStorage on change
  const saveFormState = (updates: Partial<{
    fullName: string;
    email: string;
    confirmEmail: string;
    phone: string;
    quantity: number;
    checkDeviceUnlocked: boolean;
    checkDataOnlyRefund: boolean;
    checkTermsPrivacy: boolean;
  }>) => {
    if (typeof window === "undefined") return;
    try {
      const current = {
        fullName,
        email,
        confirmEmail,
        phone,
        quantity,
        checkDeviceUnlocked,
        checkDataOnlyRefund,
        checkTermsPrivacy,
        ...updates,
      };
      sessionStorage.setItem(formStorageKey, JSON.stringify(current));
    } catch {
      // Ignore storage errors
    }
  };

  // 2. Reset loading state on pageshow event (handles browser Back button and bfcache restores)
  useState(() => {
    if (typeof window !== "undefined") {
      const handlePageShow = () => {
        setLoading(false);
      };
      window.addEventListener("pageshow", handlePageShow);
      return () => {
        window.removeEventListener("pageshow", handlePageShow);
      };
    }
  });

  // Destination metadata
  const destination = plan.country_iso ? getDestinationByIso(plan.country_iso) : null;
  const destinationName = destination?.name || plan.region_slug || "Global";
  const destinationFlag = destination?.flag || "🌐";

  // Allowed charge currencies per Step 4.3 specification
  const ALLOWED_CHARGE_CURRENCIES = ["AED", "USD", "EUR", "GBP", "SAR", "INR"] as const;
  type AllowedChargeCurrency = (typeof ALLOWED_CHARGE_CURRENCIES)[number];

  const chargeCurrency: AllowedChargeCurrency = ALLOWED_CHARGE_CURRENCIES.includes(
    currency as AllowedChargeCurrency
  )
    ? (currency as AllowedChargeCurrency)
    : "AED";

  // Financial calculations in the selected charge currency using dedicated eSIM FX rates
  const effectiveFxRate =
    esimFxRates?.[chargeCurrency] ??
    (chargeCurrency === "SAR"
      ? 3.75
      : chargeCurrency === "AED"
      ? usdToAedRate
      : convertFromUsd(1.0, chargeCurrency, rates) ?? 1.0);

  const convertedUnitPrice = Math.round(plan.sale_price_usd * effectiveFxRate * 100) / 100;
  const unitAmountMinor = Math.round(convertedUnitPrice * 100);
  const totalChargedMinor = unitAmountMinor * quantity;
  const totalChargedAmount = (totalChargedMinor / 100).toFixed(2);
  const totalSalePriceUsd = plan.sale_price_usd * quantity;

  // VAT calculations (price is VAT-inclusive when enabled)
  const netAmountMinor =
    vatEnabled && vatPct > 0
      ? Math.round(totalChargedMinor / (1 + vatPct / 100))
      : totalChargedMinor;
  const vatAmountMinor = totalChargedMinor - netAmountMinor;
  const vatAmountFormatted = (vatAmountMinor / 100).toFixed(2);
  const netAmountFormatted = (netAmountMinor / 100).toFixed(2);

  // Prefilled WhatsApp order fallback URL
  const whatsAppMessage = `Hi Masaar, I'd like to order ${quantity}x eSIM: ${destinationName} · ${
    plan.is_unlimited ? "Unlimited" : `${plan.data_gb} GB`
  } · ${plan.validity_days} days · Plan ${plan.plan_id}.`;
  const whatsAppOrderUrl = buildWhatsAppLink(whatsAppMessage);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      newErrors.fullName = "Please enter your full name (minimum 2 characters).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      newErrors.email = "Please enter a valid email address.";
    }

    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      newErrors.confirmEmail = "Email addresses do not match.";
    }

    if (!checkDeviceUnlocked) {
      newErrors.checkDeviceUnlocked = "Please confirm your smartphone is eSIM-compatible and unlocked.";
    }

    if (!checkDataOnlyRefund) {
      newErrors.checkDataOnlyRefund = "Please confirm you understand the data-only and refund terms.";
    }

    if (!checkTermsPrivacy) {
      newErrors.checkTermsPrivacy = "You must agree to the Terms & Conditions and Privacy Policy.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    // 15-second timeout that re-enables the button with an error message
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setApiError("Connecting to payment timed out or was interrupted. Please check your connection and try again.");
    }, 15000);

    try {
      const response = await fetch("/api/esim/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.plan_id,
          quantity,
          currency: chargeCurrency,
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          confirmEmail: confirmEmail.trim().toLowerCase(),
          phone: phone.trim() || undefined,
          termsAccepted: checkTermsPrivacy,
          deviceUnlockedAccepted: checkDeviceUnlocked,
          refundDataOnlyAccepted: checkDataOnlyRefund,
          hp: honeypot || undefined,
        }),
      });

      let data: Record<string, any> | null = null;
      try {
        data = await response.json();
      } catch {
        // Handle non-JSON or empty response bodies gracefully
      }

      if (!response.ok || !data?.url) {
        clearTimeout(timeoutId);
        const errMessage = data?.referenceId
          ? `${data?.error || "Failed to initialize checkout session."} (Reference: ${data.referenceId})`
          : data?.error || (response.status === 429 ? "Too many attempts. Please wait a moment." : "Failed to initialize checkout session. Please try again.");
        throw new Error(errMessage);
      }

      // Keep timeout running briefly during redirect in case browser Back occurs immediately
      // Redirect client-side to Stripe Checkout
      window.location.href = data.url;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : "Something went wrong during checkout. Please try again.";
      setApiError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-8 sm:py-14">
      <Container>
        {/* Back navigation & header */}
        <div className="mb-8">
          <Link
            href="/esim"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8F6407] hover:text-[#0A0A08] transition"
          >
            ← Back to eSIM Plans
          </Link>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[#0A0A08] sm:text-3xl">
            Order Your Travel eSIM
          </h1>
          <p className="mt-1 text-sm text-[#0A0A08]/70">
            Instant digital delivery with secure online checkout. No physical SIM swapping required.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* ──────────────── Left Column: Form & Required Declarations ──────────────── */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleCheckoutSubmit} noValidate className="space-y-6">
              {/* Bot Honeypot (hidden) */}
              <div style={{ display: "none" }} aria-hidden="true">
                <label htmlFor={honeypotId}>Do not fill this field</label>
                <input
                  id={honeypotId}
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              {/* Step 1: Quantity Selection */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#0A0A08]">1. How many eSIMs do you need?</h2>
                    <p className="mt-1 text-xs text-[#0A0A08]/65">
                      Each unit is provisioned as its own unique QR code for individual devices.
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const isSelected = quantity === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setQuantity(num);
                          saveFormState({ quantity: num });
                        }}
                        aria-pressed={isSelected}
                        className={`flex size-11 items-center justify-center rounded-xl text-sm font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] ${
                          isSelected
                            ? "bg-[#C9A227] text-white shadow-xs"
                            : "border border-black/10 bg-white text-[#0A0A08] hover:border-[#C9A227]"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                  <span className="ml-2 text-xs font-medium text-[#0A0A08]/60">
                    {quantity === 1 ? "1 device / profile" : `${quantity} devices / profiles`}
                  </span>
                </div>
              </div>

              {/* Step 2: Contact & Delivery Information */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-7 shadow-xs space-y-4">
                <div>
                  <h2 className="text-base font-bold text-[#0A0A08]">2. Delivery Information</h2>
                  <p className="mt-1 text-xs text-[#0A0A08]/65">
                    Your QR code and activation instructions will be emailed immediately after checkout.
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor={fullNameId} className="block text-xs font-bold text-[#0A0A08]">
                    Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id={fullNameId}
                    type="text"
                    required
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      saveFormState({ fullName: e.target.value });
                    }}
                    placeholder="e.g. Mohammed Al-Hashimi"
                    className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#C9A227] ${
                      errors.fullName ? "border-red-500 bg-red-50/20" : "border-black/15 bg-white"
                    }`}
                  />
                  {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor={emailId} className="block text-xs font-bold text-[#0A0A08]">
                    Email Address (QR codes sent here) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id={emailId}
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      saveFormState({ email: e.target.value });
                    }}
                    placeholder="name@example.com"
                    className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#C9A227] ${
                      errors.email ? "border-red-500 bg-red-50/20" : "border-black/15 bg-white"
                    }`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>

                {/* Confirm Email */}
                <div>
                  <label htmlFor={confirmEmailId} className="block text-xs font-bold text-[#0A0A08]">
                    Confirm Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    id={confirmEmailId}
                    type="email"
                    required
                    value={confirmEmail}
                    onChange={(e) => {
                      setConfirmEmail(e.target.value);
                      saveFormState({ confirmEmail: e.target.value });
                    }}
                    placeholder="name@example.com"
                    className={`mt-1.5 w-full rounded-xl border px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#C9A227] ${
                      errors.confirmEmail ? "border-red-500 bg-red-50/20" : "border-black/15 bg-white"
                    }`}
                  />
                  {errors.confirmEmail && (
                    <p className="mt-1 text-xs text-red-600">{errors.confirmEmail}</p>
                  )}
                </div>

                {/* Optional WhatsApp phone */}
                <div>
                  <label htmlFor={phoneId} className="block text-xs font-bold text-[#0A0A08]">
                    WhatsApp Number <span className="text-xs font-normal text-[#0A0A08]/50">(Optional — for concierge assistance)</span>
                  </label>
                  <input
                    id={phoneId}
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      saveFormState({ phone: e.target.value });
                    }}
                    placeholder="+971 50 123 4567"
                    className="mt-1.5 w-full rounded-xl border border-black/15 bg-white px-3.5 py-2.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                  />
                </div>
              </div>

              {/* Step 3: Required Declarations & Terms */}
              <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-7 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-[#0A0A08]">3. Important Declarations</h2>

                {/* Checkbox A: Device Compatibility */}
                <div className="flex items-start gap-3">
                  <input
                    id="checkDeviceUnlocked"
                    type="checkbox"
                    checked={checkDeviceUnlocked}
                    onChange={(e) => {
                      setCheckDeviceUnlocked(e.target.checked);
                      saveFormState({ checkDeviceUnlocked: e.target.checked });
                    }}
                    className="mt-1 size-4 rounded border-gray-300 text-[#C9A227] focus:ring-[#C9A227]"
                  />
                  <div className="text-xs leading-relaxed text-[#0A0A08]/80">
                    <label htmlFor="checkDeviceUnlocked" className="font-semibold text-[#0A0A08] cursor-pointer">
                      My smartphone supports eSIM and is network-unlocked.
                    </label>
                    <p className="text-[11px] text-[#0A0A08]/60 mt-0.5">
                      Carrier-locked devices cannot download eSIM profiles. (e.g. iPhone XS or newer, Galaxy S20+, Pixel 3+).
                    </p>
                    {errors.checkDeviceUnlocked && (
                      <p className="mt-1 text-xs font-medium text-red-600">{errors.checkDeviceUnlocked}</p>
                    )}
                  </div>
                </div>

                {/* Checkbox B: Data-only & Refund Policy */}
                <div className="flex items-start gap-3">
                  <input
                    id="checkDataOnlyRefund"
                    type="checkbox"
                    checked={checkDataOnlyRefund}
                    onChange={(e) => {
                      setCheckDataOnlyRefund(e.target.checked);
                      saveFormState({ checkDataOnlyRefund: e.target.checked });
                    }}
                    className="mt-1 size-4 rounded border-gray-300 text-[#C9A227] focus:ring-[#C9A227]"
                  />
                  <div className="text-xs leading-relaxed text-[#0A0A08]/80">
                    <label htmlFor="checkDataOnlyRefund" className="font-semibold text-[#0A0A08] cursor-pointer">
                      I understand this plan is data-only, refunds are only possible before installation, and validity begins upon first connection.
                    </label>
                    <p className="text-[11px] text-[#0A0A08]/60 mt-0.5">
                      No analog voice/SMS numbers. WhatsApp and VoIP calling work over data. Once an eSIM profile is installed on a phone, it cannot be returned or refunded.
                    </p>
                    {errors.checkDataOnlyRefund && (
                      <p className="mt-1 text-xs font-medium text-red-600">{errors.checkDataOnlyRefund}</p>
                    )}
                  </div>
                </div>

                {/* Checkbox C: Terms & Privacy */}
                <div className="flex items-start gap-3">
                  <input
                    id="checkTermsPrivacy"
                    type="checkbox"
                    checked={checkTermsPrivacy}
                    onChange={(e) => {
                      setCheckTermsPrivacy(e.target.checked);
                      saveFormState({ checkTermsPrivacy: e.target.checked });
                    }}
                    className="mt-1 size-4 rounded border-gray-300 text-[#C9A227] focus:ring-[#C9A227]"
                  />
                  <div className="text-xs leading-relaxed text-[#0A0A08]/80">
                    <label htmlFor="checkTermsPrivacy" className="font-semibold text-[#0A0A08] cursor-pointer">
                      I agree to the{" "}
                      <Link
                        href="/terms-conditions"
                        target="_blank"
                        className="underline text-[#8F6407] hover:text-[#0A0A08]"
                      >
                        Terms & Conditions
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy-policy"
                        target="_blank"
                        className="underline text-[#8F6407] hover:text-[#0A0A08]"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </label>
                    {errors.checkTermsPrivacy && (
                      <p className="mt-1 text-xs font-medium text-red-600">{errors.checkTermsPrivacy}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* API error alert */}
              {apiError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
                  {apiError}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#C9A227] px-6 py-4 text-sm font-bold text-[#0A0A08] transition hover:bg-[#A87F12] hover:text-white shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Connecting to Secure Payment...
                  </>
                ) : (
                  <>
                    <LockIcon className="size-4" />
                    Pay Now · {totalChargedAmount} {chargeCurrency}
                  </>
                )}
              </button>

              {/* Payment Trust Icons */}
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4 text-[11px] text-[#0A0A08]/60 font-medium">
                  <span className="inline-flex items-center gap-1">
                    <LockIcon className="size-3 text-[#25D366]" />
                    256-Bit SSL Encrypted
                  </span>
                  <span>·</span>
                  <span>Apple Pay & Google Pay</span>
                  <span>·</span>
                  <span>Visa & Mastercard</span>
                </div>
              </div>
            </form>
          </div>

          {/* ──────────────── Right Column: Order Summary Card ──────────────── */}
          <div className="lg:col-span-5">
            <div className="sticky top-6 rounded-2xl border border-black/10 bg-white p-6 sm:p-7 shadow-xs space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F6407]">
                  Order Summary
                </span>
                <h2 className="mt-1 font-[family-name:var(--font-display)] text-xl font-bold text-[#0A0A08]">
                  {plan.name}
                </h2>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#FAF7F2] border border-black/5 px-2.5 py-1 text-xs font-medium text-[#0A0A08]/80">
                  <span>{destinationFlag}</span>
                  <span>{destinationName}</span>
                </div>
              </div>

              {/* Plan Specs Strip */}
              <div className="divide-y divide-black/5 rounded-xl border border-black/5 bg-[#FAF7F2]/60 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs pt-1 first:pt-0">
                  <span className="text-[#0A0A08]/60">Data Allowance</span>
                  <span className="font-bold text-[#0A0A08]">
                    {plan.is_unlimited ? "Unlimited Data" : `${plan.data_gb} GB`}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2.5">
                  <span className="text-[#0A0A08]/60">Validity Period</span>
                  <span className="font-bold text-[#0A0A08]">{plan.validity_days} Days</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2.5">
                  <span className="text-[#0A0A08]/60">Coverage & Network</span>
                  <span className="font-bold text-[#0A0A08]">
                    {plan.network_type ? `${plan.network_type} High-Speed` : "5G / 4G LTE"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2.5">
                  <span className="text-[#0A0A08]/60">Personal Hotspot</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-[#25D366]">
                    <CheckIcon className="size-3.5" /> Supported
                  </span>
                </div>

                {plan.fup_note && (
                  <div className="text-[11px] text-[#0A0A08]/65 pt-2 italic">
                    {plan.fup_note}
                  </div>
                )}
              </div>

              {/* Pricing Section */}
              <div className="border-t border-black/5 pt-5 space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-[#0A0A08]/70">
                    Selected Price ({quantity} {quantity === 1 ? "unit" : "units"})
                  </span>
                  <span className="font-[family-name:var(--font-display)] text-lg font-bold text-[#0A0A08]">
                    {CURRENCY_PREFIX[chargeCurrency] ?? chargeCurrency}{" "}
                    {totalChargedAmount}
                  </span>
                </div>

                {/* Currency Charge Disclosure */}
                <div className="rounded-xl border border-[#C9A227]/30 bg-[#FAF7F2] p-3 text-xs leading-relaxed text-[#0A0A08]/90 space-y-1.5">
                  <div className="font-semibold text-[#8F6407]">
                    You will be charged{" "}
                    <span className="font-bold text-[#0A0A08]">
                      {totalChargedAmount} {chargeCurrency}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#0A0A08]/75">
                    Your bank may apply its own conversion fees if your card uses a different currency.
                  </p>
                  {vatEnabled && (
                    <div className="mt-2 border-t border-black/5 pt-2 text-[11px] space-y-0.5">
                      <div className="font-semibold text-[#8F6407]">Price includes {vatPct}% VAT</div>
                      <div className="flex justify-between text-[#0A0A08]/60">
                        <span>Net Amount: {netAmountFormatted} {chargeCurrency}</span>
                        <span>VAT ({vatPct}%): {vatAmountFormatted} {chargeCurrency}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* WhatsApp Alternative CTA */}
              <div className="border-t border-black/5 pt-4 text-center">
                <p className="text-xs text-[#0A0A08]/65 mb-2">Prefer not to pay by card online?</p>
                <a
                  href={whatsAppOrderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0A0A08] hover:text-[#25D366] transition underline underline-offset-2"
                >
                  <WhatsAppIcon className="size-3.5 text-[#25D366]" />
                  Prefer to order on WhatsApp?
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
