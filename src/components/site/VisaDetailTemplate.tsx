"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { CONTACT } from "@/lib/contact";
import type { VisaDocumentRow, VisaTypeRow, VisaProductRow } from "@/lib/types/database";

interface VisaDetailTemplateProps {
  visaType: VisaTypeRow;
  documents: VisaDocumentRow[];
  products?: VisaProductRow[];
}

export function VisaDetailTemplate({ visaType, documents, products = [] }: VisaDetailTemplateProps) {
  const isOnlineMode = visaType.service_mode === "online" || ["uae", "saudi-tourist", "us"].includes(visaType.slug);

  // Enquiry form state for Enquiry Mode
  const [enquiryName, setEnquiryName] = useState("");
  const [enquiryEmail, setEnquiryEmail] = useState("");
  const [enquiryPhone, setEnquiryPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+971");
  const [travellersCount, setTravellersCount] = useState("1");
  const [enquiryMessage, setEnquiryMessage] = useState("");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const heroImage =
    visaType.hero_image_url ||
    (visaType.slug === "uae"
      ? "/trips/destination-image.webp"
      : visaType.slug === "saudi-tourist"
      ? "/trips/package-detail-hero-1.webp"
      : visaType.slug === "us"
      ? "/trips/package-detail-hero-3.webp"
      : visaType.slug === "umrah"
      ? "/trips/umrah-banner.webp"
      : visaType.slug === "india"
      ? "/trips/package-detail-hero-2.webp"
      : "/trips/visa-assistance-card-home.webp");

  const defaultImportantInfo = [
    "Visa requirements, processing times and fees can vary based on your nationality and are subject to change.",
    "Please always verify the latest information with the relevant embassy, consulate or authority.",
    "Masaar Holidays facilitates visa applications and provides guidance throughout the process, but cannot guarantee approval — the final decision rests solely with the relevant authorities.",
  ];

  const importantInfoList = visaType.important_info_text
    ? visaType.important_info_text.split("\n").map((p) => p.trim()).filter(Boolean)
    : defaultImportantInfo;

  // Build standard 4 document items if none or fewer configured
  const displayDocuments = documents.length > 0
    ? documents
    : [
        {
          id: "doc-1",
          title: "Valid Passport",
          description: "Minimum 6 months validity from intended travel date.",
          icon_key: "passport",
        },
        {
          id: "doc-2",
          title: "Passport Photo",
          description: "Recent passport-size photo with white background (within 6 months).",
          icon_key: "photo",
        },
        {
          id: "doc-3",
          title: isOnlineMode ? "Application Form" : "Completed Details",
          description: "Complete the form with accurate personal and travel details.",
          icon_key: "document",
        },
        {
          id: "doc-4",
          title: "Supporting Documents",
          description: "May be required based on nationality (e.g. return flight, hotel voucher).",
          icon_key: "hotel",
        },
      ];

  // Specific FAQs for this visa type
  const faqs = isOnlineMode
    ? [
        {
          q: `How long does the ${visaType.name} process take?`,
          a: "Standard processing is typically 3 to 5 working days from successful document submission and fee verification. Express options may be available depending on immigration authorities.",
        },
        {
          q: `What documents do I need to apply for ${visaType.name}?`,
          a: "You will need a valid passport (minimum 6 months remaining validity), a recent colour photograph on a white background, and your confirmed travel details.",
        },
        {
          q: `Can I apply for ${visaType.name} completely online?`,
          a: "Yes! The application, document upload, and secure card payment are completed directly online through our secure portal.",
        },
        {
          q: "Is the visa fee refundable if rejected?",
          a: "Government visa fees and mandatory application processing charges are non-refundable once submitted to the respective immigration authorities.",
        },
        {
          q: `What is the validity of the ${visaType.name}?`,
          a: "Depending on the package selected, entry validity is usually 30 to 60 days from issuance, allowing single or multiple stays as configured.",
        },
        {
          q: "Can I apply for multiple family members together?",
          a: "Yes, our online checkout allows adding multiple applicants in a single order, saving time and keeping your family's travel documents organized.",
        },
      ]
    : [
        {
          q: `How long does the ${visaType.name} take to process?`,
          a: "Processing times vary based on embassy appointment availability and nationality. Our team will review your specifics and provide an exact timeline upon enquiry.",
        },
        {
          q: "What assistance does Masaar Holidays provide?",
          a: "We provide end-to-end support including eligibility evaluation, document checklist preparation, consular form filling, appointment booking, and visa tracking.",
        },
        {
          q: "Do I need confirmed flight and hotel bookings first?",
          a: "We advise preparing your itinerary details. Our travel team can assist with verified hotel reservations and flight itineraries tailored for your visa requirements.",
        },
        {
          q: "How do I start my enquiry?",
          a: "Simply fill out the enquiry form on this page or message us directly on WhatsApp. Our dedicated visa consultants will contact you promptly.",
        },
      ];

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneFull = `${countryCode} ${enquiryPhone}`.trim();
    const text = `Assalamu Alaikum Masaar Holidays, I would like to enquire about ${visaType.name}.\n\n*Name:* ${enquiryName}\n*Phone:* ${phoneFull}\n*Email:* ${enquiryEmail || "N/A"}\n*Travellers:* ${travellersCount}\n*Message:* ${enquiryMessage || "Please assist with requirements and process."}`;
    const url = `https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-warm-ivory/20 text-masaar-black">
      {/* 1. Breadcrumbs */}
      <div className="bg-warm-ivory/60 border-b border-black/5 py-2.5">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Visa", href: "/visa" },
              { label: visaType.name },
            ]}
          />
        </Container>
      </div>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-masaar-black py-16 text-white sm:py-24">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src={heroImage}
            alt={visaType.name}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-masaar-black via-masaar-black/80 to-transparent" />
        </div>

        <Container className="relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            {/* Eyebrow */}
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
              — {visaType.category?.toUpperCase() || visaType.name.toUpperCase()} VISA —
            </p>

            {/* Headline */}
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              {isOnlineMode ? (
                <>
                  Apply for Your <br className="hidden sm:inline" />
                  <span className="text-white">{visaType.name} Online</span>
                  <br />
                  <span className="font-[family-name:var(--font-display)] italic text-pure-gold text-2xl sm:text-4xl">
                    Fast. Simple. Reliable.
                  </span>
                </>
              ) : (
                <>
                  Your {visaType.name} Journey <br className="hidden sm:inline" />
                  <span className="font-[family-name:var(--font-display)] italic text-pure-gold">
                    Starts With the Right Visa
                  </span>
                </>
              )}
            </h1>

            {/* Intro text */}
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              {visaType.hero_intro ||
                visaType.description ||
                "Get your visa with a simple guided process, secure payment, and dedicated expert support from Masaar Holidays."}
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {isOnlineMode ? (
                <>
                  <button
                    onClick={() => scrollTo("packages")}
                    className="inline-flex items-center justify-center rounded-md bg-pure-gold px-7 py-3.5 text-sm font-semibold text-masaar-black shadow-lg transition-all hover:bg-light-gold active:scale-95"
                  >
                    Apply Now →
                  </button>
                  <a
                    href={`https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
                      `Hello Masaar Holidays, I have an enquiry regarding ${visaType.name}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    Talk to Our Team
                  </a>
                </>
              ) : (
                <>
                  <button
                    onClick={() => scrollTo("enquiry-form")}
                    className="inline-flex items-center justify-center rounded-md bg-pure-gold px-7 py-3.5 text-sm font-semibold text-masaar-black shadow-lg transition-all hover:bg-light-gold active:scale-95"
                  >
                    Enquire Now →
                  </button>
                  <a
                    href={`https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
                      `Hello Masaar Holidays, I need assistance with ${visaType.name}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
                  >
                    WhatsApp Guidance
                  </a>
                </>
              )}
            </div>

            {/* 3 Trust Badges */}
            <div className="mt-12 grid grid-cols-1 gap-4 border-t border-white/15 pt-8 sm:grid-cols-3">
              <div className="flex items-center justify-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-pure-gold">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">Trusted Guidance</p>
                  <p className="text-[11px] text-white/60">From application to approval</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-pure-gold">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">
                    {isOnlineMode ? "Secure Online Payment" : "Document Review"}
                  </p>
                  <p className="text-[11px] text-white/60">
                    {isOnlineMode ? "Safe & 256-bit encrypted" : "Clear checklist and review"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-pure-gold">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">Dedicated Support</p>
                  <p className="text-[11px] text-white/60">Our team is always here to help</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 3. In-Page Navigation Pills Bar */}
      <div className="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur-md">
        <Container>
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-3 sm:gap-4 scrollbar-none">
            <button
              onClick={() => scrollTo("overview")}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-masaar-black/80 hover:bg-warm-ivory hover:text-masaar-black"
            >
              Overview
            </button>
            {isOnlineMode && (
              <button
                onClick={() => scrollTo("packages")}
                className="rounded-full bg-pure-gold/15 px-4 py-1.5 text-xs font-semibold text-deep-gold hover:bg-pure-gold/25"
              >
                Visa Options
              </button>
            )}
            <button
              onClick={() => scrollTo("documents")}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-masaar-black/80 hover:bg-warm-ivory hover:text-masaar-black"
            >
              Documents
            </button>
            <button
              onClick={() => scrollTo("how-it-works")}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-masaar-black/80 hover:bg-warm-ivory hover:text-masaar-black"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollTo("important-info")}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-masaar-black/80 hover:bg-warm-ivory hover:text-masaar-black"
            >
              Important Info
            </button>
            <button
              onClick={() => scrollTo("faqs")}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-masaar-black/80 hover:bg-warm-ivory hover:text-masaar-black"
            >
              FAQs
            </button>
          </div>
        </Container>
      </div>

      {/* MODE 1: ONLINE APPLICATION MODE (V02) */}
      {isOnlineMode ? (
        <>
          {/* Section: About Visa */}
          <section id="overview" className="scroll-mt-16 py-16 sm:py-20">
            <Container>
              <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
                    About {visaType.name}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-masaar-black/75 sm:text-base">
                    {visaType.description ||
                      `We help you apply for your ${visaType.name} online with a smooth, reliable and transparent process, ensuring accurate documentation and timely submission to authorities.`}
                  </p>

                  {/* 2x2 Feature Pills Grid */}
                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-masaar-black">Multiple visa options</p>
                        <p className="text-[11px] text-masaar-black/60">Single & multiple entry options</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-masaar-black">Fast processing</p>
                        <p className="text-[11px] text-masaar-black/60">Regular status notifications</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-masaar-black">Expert review</p>
                        <p className="text-[11px] text-masaar-black/60">Documents checked by specialists</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-masaar-black">Travel with confidence</p>
                        <p className="text-[11px] text-masaar-black/60">Reliable and secure process</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right side guide card */}
                <div className="relative aspect-video overflow-hidden rounded-2xl border border-black/10 bg-masaar-black shadow-lg">
                  <Image
                    src={heroImage}
                    alt={`${visaType.name} Guide`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-16 items-center justify-center rounded-full bg-white/90 text-pure-gold shadow-xl backdrop-blur-md transition-transform hover:scale-110">
                      <svg className="ml-1 size-7 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <div>
                      <p className="text-xs font-semibold">{visaType.name} Guidance</p>
                      <p className="text-[10px] text-white/70">Watch our step-by-step application walkthrough</p>
                    </div>
                  </div>
                </div>
              </div>
            </Container>
          </section>

          {/* Section: Choose Your Visa Package (Pricing Grid) */}
          <section id="packages" className="scroll-mt-16 bg-white py-16 sm:py-24">
            <Container>
              <div className="text-center">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-4xl">
                  Choose Your {visaType.name} Package
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-xs text-masaar-black/60 sm:text-sm">
                  Select the option that best fits your travel plans. All prices are in USD and calculated from verified rate records.
                </p>
              </div>

              {/* 4-column cards grid */}
              <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`relative flex flex-col justify-between rounded-xl border bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${
                      product.is_popular
                        ? "border-pure-gold ring-2 ring-pure-gold/20"
                        : "border-black/10"
                    }`}
                  >
                    {product.is_popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pure-gold px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-masaar-black shadow-sm">
                        Most Popular
                      </span>
                    )}

                    <div>
                      <h3 className="font-semibold text-masaar-black sm:text-base">
                        {product.title}
                      </h3>
                      {product.subtitle && (
                        <p className="mt-1 text-xs text-masaar-black/60">
                          {product.subtitle}
                        </p>
                      )}

                      <div className="mt-4 flex items-baseline gap-1 border-b border-black/5 pb-4">
                        <span className="text-xs font-semibold text-masaar-black/60">USD</span>
                        <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black sm:text-4xl">
                          {product.total_usd}
                        </span>
                      </div>

                      {/* Checklist */}
                      <ul className="mt-4 space-y-2.5 text-xs text-masaar-black/80">
                        {product.inclusions.map((inc, i) => (
                          <li key={i} className="flex items-center gap-2">
                            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                              <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            <span>{inc}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4">
                      <Link
                        href={`/visa/${visaType.slug}/apply?product=${product.id}`}
                        className={`inline-flex w-full items-center justify-center rounded-md px-4 py-3 text-xs font-semibold transition-all active:scale-95 ${
                          product.is_popular
                            ? "bg-pure-gold text-masaar-black shadow hover:bg-light-gold"
                            : "border border-pure-gold text-masaar-black hover:bg-pure-gold/15"
                        }`}
                      >
                        Apply Now →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price & Eligibility Warning Banner */}
              <div className="mt-10 rounded-xl border border-pure-gold/30 bg-warm-ivory p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold shadow-sm">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-deep-gold">
                      Price & Eligibility Notice
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-masaar-black/75">
                      Visa fees, validity and eligibility may vary based on your nationality and current regulations. Our team will review your application and confirm exact details before processing. Transparent fees are shown before checkout.
                    </p>
                  </div>
                </div>
              </div>
            </Container>
          </section>

          {/* Section: Documents Required */}
          <section id="documents" className="scroll-mt-16 py-16 sm:py-20">
            <Container>
              <div className="text-center">
                <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
                  Documents Required
                </h2>
                <p className="mx-auto mt-2 max-w-xl text-xs text-masaar-black/60 sm:text-sm">
                  Prepare the following documents to complete your {visaType.name} online application.
                </p>
              </div>

              <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {displayDocuments.map((doc, idx) => (
                  <div key={idx} className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                    <span className="flex size-11 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
                      <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    <h3 className="mt-4 font-semibold text-masaar-black text-sm">{doc.title}</h3>
                    {doc.description && (
                      <p className="mt-1 text-xs leading-relaxed text-masaar-black/60">{doc.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </Container>
          </section>

          {/* Section: How It Works */}
          <section id="how-it-works" className="scroll-mt-16 bg-white py-16 sm:py-20">
            <Container>
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
                  A Simple and Transparent Process
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
                  How It Works
                </h2>
                <p className="mt-1 text-xs text-masaar-black/60">
                  Apply for your {visaType.name} in a few easy steps.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <div className="relative text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pure-gold text-sm font-bold text-masaar-black shadow-md">
                    1
                  </span>
                  <h3 className="mt-4 font-semibold text-masaar-black text-sm">Choose Your Package</h3>
                  <p className="mt-1 text-xs text-masaar-black/60">Select the visa option that suits your travel plans.</p>
                </div>

                <div className="relative text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pure-gold text-sm font-bold text-masaar-black shadow-md">
                    2
                  </span>
                  <h3 className="mt-4 font-semibold text-masaar-black text-sm">Fill in the Details</h3>
                  <p className="mt-1 text-xs text-masaar-black/60">Complete the online form and upload required documents.</p>
                </div>

                <div className="relative text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pure-gold text-sm font-bold text-masaar-black shadow-md">
                    3
                  </span>
                  <h3 className="mt-4 font-semibold text-masaar-black text-sm">Secure Payment</h3>
                  <p className="mt-1 text-xs text-masaar-black/60">Pay online safely via encrypted Stripe checkout.</p>
                </div>

                <div className="relative text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pure-gold text-sm font-bold text-masaar-black shadow-md">
                    4
                  </span>
                  <h3 className="mt-4 font-semibold text-masaar-black text-sm">Get Updates</h3>
                  <p className="mt-1 text-xs text-masaar-black/60">We review and submit your visa, keeping you informed.</p>
                </div>
              </div>
            </Container>
          </section>

          {/* Section: Important Information */}
          <section id="important-info" className="scroll-mt-16 py-12">
            <Container>
              <div className="rounded-xl border border-pure-gold/30 bg-warm-ivory p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold shadow-sm">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-deep-gold">
                      Important Information
                    </h3>
                    <ul className="mt-3 space-y-2 text-xs leading-relaxed text-masaar-black/75 sm:text-sm">
                      {importantInfoList.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-pure-gold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Container>
          </section>

          {/* Section: FAQs */}
          <section id="faqs" className="scroll-mt-16 bg-white py-16 sm:py-20">
            <Container>
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
                  Frequently Asked Questions
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
                  Your Questions, Our Guidance
                </h2>
                <p className="mt-1 text-xs text-masaar-black/60">
                  Find clear answers to common questions about {visaType.name} applications.
                </p>
              </div>

              <div className="mx-auto mt-10 max-w-4xl divide-y divide-black/5">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="py-4">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="flex w-full items-center justify-between text-left font-semibold text-masaar-black text-sm transition-colors hover:text-deep-gold"
                    >
                      <span>{faq.q}</span>
                      <span className="ml-4 text-pure-gold text-lg font-bold">
                        {openFaqIndex === idx ? "−" : "+"}
                      </span>
                    </button>
                    {openFaqIndex === idx && (
                      <p className="mt-2 text-xs leading-relaxed text-masaar-black/70 sm:text-sm">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Container>
          </section>

          {/* Sticky Mobile Apply Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white/95 p-3.5 backdrop-blur-md sm:hidden">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-masaar-black">{visaType.name}</p>
                <p className="text-[10px] text-masaar-black/60">From USD {products[0]?.total_usd || 110}</p>
              </div>
              <button
                onClick={() => scrollTo("packages")}
                className="rounded-md bg-pure-gold px-5 py-2.5 text-xs font-semibold text-masaar-black shadow-md hover:bg-light-gold"
              >
                Apply Online
              </button>
            </div>
          </div>
        </>
      ) : (
        /* MODE 2: ENQUIRY MODE (V03) */
        <>
          <section id="overview" className="scroll-mt-16 py-16 sm:py-20">
            <Container>
              <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
                {/* Left Column: Specs & Details */}
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
                    About {visaType.name}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-masaar-black/75 sm:text-base">
                    {visaType.description ||
                      `We provide complete assistance and bespoke guidance for ${visaType.name}, ensuring all regulations, eligibility requirements, and documentation are meticulously prepared.`}
                  </p>

                  {/* 2x3 Spec Pills Grid */}
                  <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-masaar-black">Visa Type</p>
                        <p className="text-[11px] text-masaar-black/60">{visaType.category || "Specialist"} Visa</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-masaar-black">Typical Validity</p>
                        <p className="text-[11px] text-masaar-black/60">30 – 90 Days / As per approval</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-masaar-black">Entry Type</p>
                        <p className="text-[11px] text-masaar-black/60">Single / Multiple (as per option)</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-masaar-black">Processing Time</p>
                        <p className="text-[11px] text-masaar-black/60">Usually 3 – 7 working days</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-masaar-black">Suitable For</p>
                        <p className="text-[11px] text-masaar-black/60">Individuals, families and groups</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-sm">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </span>
                      <div>
                        <p className="text-xs font-semibold text-masaar-black">Our Support</p>
                        <p className="text-[11px] text-masaar-black/60">End-to-end guidance & follow-up</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents Required in Enquiry Mode */}
                  <div id="documents" className="mt-12 scroll-mt-16">
                    <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-masaar-black sm:text-2xl">
                      Documents Required
                    </h3>
                    <p className="mt-1 text-xs text-masaar-black/60">
                      The following documents are typically requested for {visaType.name}. Requirements vary by nationality and authority regulations.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {displayDocuments.map((doc, idx) => (
                        <div key={idx} className="rounded-lg border border-black/5 bg-white p-4 shadow-sm">
                          <span className="flex size-9 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
                            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </span>
                          <h4 className="mt-3 font-semibold text-masaar-black text-xs">{doc.title}</h4>
                          {doc.description && (
                            <p className="mt-1 text-[11px] text-masaar-black/60">{doc.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Sticky Enquiry Card */}
                <div id="enquiry-form" className="scroll-mt-20">
                  <div className="sticky top-20 rounded-2xl border border-black/10 bg-white p-6 shadow-md sm:p-7">
                    <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold text-masaar-black">
                      Enquire About {visaType.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-masaar-black/60">
                      Fill in your details and our team will get back to you with personalised assistance.
                    </p>

                    <form onSubmit={handleEnquirySubmit} className="mt-6 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-masaar-black">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={enquiryName}
                          onChange={(e) => setEnquiryName(e.target.value)}
                          placeholder="Enter your full name"
                          className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3.5 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-masaar-black">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={enquiryEmail}
                          onChange={(e) => setEnquiryEmail(e.target.value)}
                          placeholder="Enter your email address"
                          className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3.5 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-masaar-black">
                          Phone / WhatsApp Number <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1.5 flex gap-2">
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            aria-label="Country Dial Code"
                            className="w-24 rounded-md border border-black/15 bg-warm-ivory/20 px-2 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                          >
                            <option value="+971">🇦🇪 +971</option>
                            <option value="+966">🇸🇦 +966</option>
                            <option value="+44">🇬🇧 +44</option>
                            <option value="+1">🇺🇸 +1</option>
                            <option value="+91">🇮🇳 +91</option>
                            <option value="+92">🇵🇰 +92</option>
                            <option value="+880">🇧🇩 +880</option>
                          </select>
                          <input
                            type="tel"
                            required
                            value={enquiryPhone}
                            onChange={(e) => setEnquiryPhone(e.target.value)}
                            placeholder="Enter phone number"
                            className="flex-1 rounded-md border border-black/15 bg-warm-ivory/20 px-3.5 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-masaar-black">
                          Number of Travellers
                        </label>
                        <select
                          value={travellersCount}
                          onChange={(e) => setTravellersCount(e.target.value)}
                          aria-label="Number of Travellers"
                          className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3.5 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                        >
                          <option value="1">1 Traveller</option>
                          <option value="2">2 Travellers</option>
                          <option value="3-4">3 - 4 Travellers</option>
                          <option value="5+">5+ Travellers (Family/Group)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-masaar-black">
                          Message (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={enquiryMessage}
                          onChange={(e) => setEnquiryMessage(e.target.value)}
                          placeholder="Tell us about your nationality, travel dates, or specific questions"
                          className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3.5 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-2 rounded-md bg-pure-gold py-3 text-xs font-semibold text-masaar-black shadow transition-all hover:bg-light-gold active:scale-95"
                      >
                        <svg className="size-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
                        </svg>
                        Enquire on WhatsApp
                      </button>

                      <p className="text-center text-[11px] text-masaar-black/50">
                        Our team will respond promptly during working hours.
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            </Container>
          </section>

          {/* Section: Process Flow in Enquiry Mode */}
          <section id="how-it-works" className="scroll-mt-16 bg-white py-16 sm:py-20">
            <Container>
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
                  A Simple and Guided Process
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
                  How It Works
                </h2>
                <p className="mt-1 text-xs text-masaar-black/60">
                  Get your {visaType.name} with our step-by-step guidance.
                </p>
              </div>

              <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                <div className="text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pure-gold text-sm font-bold text-masaar-black shadow-md">
                    1
                  </span>
                  <h3 className="mt-4 font-semibold text-masaar-black text-sm">Share Your Details</h3>
                  <p className="mt-1 text-xs text-masaar-black/60">Tell us your travel plans and passport nationality.</p>
                </div>

                <div className="text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pure-gold text-sm font-bold text-masaar-black shadow-md">
                    2
                  </span>
                  <h3 className="mt-4 font-semibold text-masaar-black text-sm">Document Review</h3>
                  <p className="mt-1 text-xs text-masaar-black/60">Our visa team reviews your files and requirements.</p>
                </div>

                <div className="text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pure-gold text-sm font-bold text-masaar-black shadow-md">
                    3
                  </span>
                  <h3 className="mt-4 font-semibold text-masaar-black text-sm">Application Submission</h3>
                  <p className="mt-1 text-xs text-masaar-black/60">We file the application and book required appointments.</p>
                </div>

                <div className="text-center">
                  <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pure-gold text-sm font-bold text-masaar-black shadow-md">
                    4
                  </span>
                  <h3 className="mt-4 font-semibold text-masaar-black text-sm">Receive Your Visa</h3>
                  <p className="mt-1 text-xs text-masaar-black/60">Receive your visa and travel guidance with peace of mind.</p>
                </div>
              </div>
            </Container>
          </section>

          {/* Section: Important Information */}
          <section id="important-info" className="scroll-mt-16 py-12">
            <Container>
              <div className="rounded-xl border border-pure-gold/30 bg-warm-ivory p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold shadow-sm">
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-deep-gold">
                      Important Information
                    </h3>
                    <ul className="mt-3 space-y-2 text-xs leading-relaxed text-masaar-black/75 sm:text-sm">
                      {importantInfoList.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-pure-gold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </Container>
          </section>

          {/* Section: FAQs in Enquiry Mode */}
          <section id="faqs" className="scroll-mt-16 bg-white py-16 sm:py-20">
            <Container>
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
                  Frequently Asked Questions
                </p>
                <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
                  Your Questions, Our Guidance
                </h2>
                <p className="mt-1 text-xs text-masaar-black/60">
                  Find clear answers to common questions about {visaType.name} guidance.
                </p>
              </div>

              <div className="mx-auto mt-10 max-w-4xl divide-y divide-black/5">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="py-4">
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                      className="flex w-full items-center justify-between text-left font-semibold text-masaar-black text-sm transition-colors hover:text-deep-gold"
                    >
                      <span>{faq.q}</span>
                      <span className="ml-4 text-pure-gold text-lg font-bold">
                        {openFaqIndex === idx ? "−" : "+"}
                      </span>
                    </button>
                    {openFaqIndex === idx && (
                      <p className="mt-2 text-xs leading-relaxed text-masaar-black/70 sm:text-sm">
                        {faq.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Container>
          </section>
        </>
      )}

      {/* 4. Bottom Split Banner: "Speak to Our Visa Experts" (matches V02.png & V03.png) */}
      <section className="bg-white border-t border-black/5 py-16 sm:py-20">
        <Container>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-warm-ivory via-white to-warm-ivory p-8 sm:p-12 lg:p-14 border border-black/10 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-deep-gold">
                  Need Assistance?
                </p>
                <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-4xl">
                  Speak to Our Visa Experts
                </h3>
                <p className="mt-3 text-xs leading-relaxed text-masaar-black/70 sm:text-sm">
                  Have questions or need personalised guidance? Our team is here to help you with the right information for your travel plans.
                </p>
                <div className="mt-6 flex flex-wrap gap-4">
                  <a
                    href={`https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
                      `Hello Masaar Holidays, I would like to speak with a visa specialist regarding ${visaType.name}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md bg-pure-gold px-6 py-3.5 text-xs font-semibold text-masaar-black shadow-md transition-all hover:bg-light-gold active:scale-95"
                  >
                    <svg className="size-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.145.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
                    </svg>
                    Chat on WhatsApp
                  </a>
                  <a
                    href={`tel:+${CONTACT.whatsappPhoneIntl}`}
                    className="inline-flex items-center gap-2 rounded-md border border-black/15 bg-white px-6 py-3.5 text-xs font-semibold text-masaar-black transition-all hover:bg-black/5"
                  >
                    Call {CONTACT.phoneDisplay}
                  </a>
                </div>
              </div>

              <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-black/10 shadow-inner">
                <Image
                  src="/trips/visa-assistance-card-home.webp"
                  alt="Masaar Visa Assistance"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 5. CRITICAL PRESERVATION RULE: "Thoughtful Services for Every Part of Your Journey" */}
      <CrossLinkServices exclude="visa" />
    </div>
  );
}
