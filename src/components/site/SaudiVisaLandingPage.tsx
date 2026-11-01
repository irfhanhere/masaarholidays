"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { Container } from "@/components/site/Container";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { Price } from "@/components/site/Price";
import { CONTACT } from "@/lib/contact";
import {
  FileCheck,
  ShieldCheck,
  Clock,
  Lock,
  AlertCircle,
  Plus,
  Minus,
  Upload,
  CheckCircle2,
  Trash2,
  User,
  Users,
  Check,
} from "./saudi-visa-icons";
import {
  calculateSaudiVisaPricing,
  isNationalityApproved,
  validateApplicantEligibility,
  getSaudiVisaWhatsAppLink,
  type PricingBreakdown,
} from "@/lib/data/saudi-visa-settings";
import { trackMetaPixel } from "@/lib/analytics/meta-pixel";

interface UploadedDoc {
  applicantIndex: number;
  documentType: "passport" | "photo" | "emirates_id";
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  previewUrl?: string | null;
}

interface ApplicantFormData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  residenceExpiryDate: string;
  emiratesIdNumber: string;
  emiratesIdExpiryDate: string;
}

const EMPTY_APPLICANT: ApplicantFormData = {
  fullName: "",
  dateOfBirth: "",
  gender: "Male",
  nationality: "India",
  passportNumber: "",
  passportIssueDate: "",
  passportExpiryDate: "",
  residenceExpiryDate: "",
  emiratesIdNumber: "",
  emiratesIdExpiryDate: "",
};

export function SaudiVisaLandingPage() {
  const [applicationType, setApplicationType] = useState<"individual" | "family">("individual");
  const [applicantCount, setApplicantCount] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Eligibility state
  const [eligibilityNationality, setEligibilityNationality] = useState<string>("India");
  const [isUaeResident, setIsUaeResident] = useState<boolean>(true);
  const [passportValidMonths, setPassportValidMonths] = useState<boolean>(true);
  const [residenceValidMonths, setResidenceValidMonths] = useState<boolean>(true);
  const [travelPurpose, setTravelPurpose] = useState<string>("Umrah");
  const [travelDate, setTravelDate] = useState<string>("");

  // Primary contact
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");

  // Applicants array
  const [applicants, setApplicants] = useState<ApplicantFormData[]>([
    { ...EMPTY_APPLICANT, nationality: "India" },
  ]);

  // Uploaded documents
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [uploadingSlots, setUploadingSlots] = useState<Record<string, boolean>>({});

  // Terms and gateway
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  const [paymentGateway, setPaymentGateway] = useState<"stripe" | "tabby">("stripe");
  const [isTabbyAvailable, setIsTabbyAvailable] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, startSubmission] = useTransition();

  // Active applicant tab in Step 3
  const [activeApplicantIndex, setActiveApplicantIndex] = useState<number>(0);

  // Pricing calculation
  const effectiveCount = applicationType === "individual" ? 1 : Math.max(3, applicantCount);
  const pricing: PricingBreakdown = calculateSaudiVisaPricing(effectiveCount, applicationType);

  // Fire ViewContent on page mount and probe Tabby availability
  useEffect(() => {
    trackMetaPixel("ViewContent", {
      content_name: "Saudi 1-Year Multiple Entry Tourist Visa",
      content_category: "Saudi Visa Landing",
      value: 750,
      currency: "AED",
    });

    fetch("/api/tabby/config")
      .then((res) => res.json())
      .then((data) => {
        if (data?.enabled) {
          setIsTabbyAvailable(true);
        } else {
          setPaymentGateway("stripe");
        }
      })
      .catch(() => {
        setPaymentGateway("stripe");
      });
  }, []);

  // Handlers for switching application type
  const handleSelectIndividual = () => {
    setApplicationType("individual");
    setApplicantCount(1);
    setApplicants((prev) => [prev[0] || { ...EMPTY_APPLICANT, nationality: eligibilityNationality }]);
    trackMetaPixel("ApplicationStarted", { application_type: "individual", applicant_count: 1 });
    setCurrentStep(2);
  };

  const handleSelectFamily = () => {
    setApplicationType("family");
    const count = 3;
    setApplicantCount(count);
    setApplicants((prev) => {
      const next = [...prev];
      while (next.length < count) {
        next.push({ ...EMPTY_APPLICANT, nationality: eligibilityNationality });
      }
      return next.slice(0, count);
    });
    trackMetaPixel("ApplicationStarted", { application_type: "family", applicant_count: count });
    setCurrentStep(2);
  };

  const handleUpdateFamilyCount = (newCount: number) => {
    if (newCount < 3) return;
    setApplicantCount(newCount);
    setApplicants((prev) => {
      const next = [...prev];
      if (newCount > next.length) {
        for (let i = next.length; i < newCount; i++) {
          next.push({ ...EMPTY_APPLICANT, nationality: eligibilityNationality });
        }
      } else {
        next.splice(newCount);
      }
      return next;
    });
    trackMetaPixel("ApplicantAdded", { applicant_count: newCount });
  };

  const handleApplicantChange = (index: number, field: keyof ApplicantFormData, value: string) => {
    setApplicants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Upload handler
  const handleFileUpload = async (applicantIdx: number, docType: "passport" | "photo" | "emirates_id", file: File) => {
    const slotKey = `${applicantIdx}_${docType}`;
    setUploadingSlots((prev) => ({ ...prev, [slotKey]: true }));
    setSubmissionError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", `${docType}_app${applicantIdx + 1}`);

      const res = await fetch("/api/visa/upload-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "File upload failed");
      }

      setUploadedDocs((prev) => {
        const filtered = prev.filter(
          (d) => !(d.applicantIndex === applicantIdx && d.documentType === docType)
        );
        return [
          ...filtered,
          {
            applicantIndex: applicantIdx,
            documentType: docType,
            filePath: data.filePath,
            fileName: data.fileName,
            fileSize: data.fileSize,
            mimeType: data.mimeType,
            previewUrl: data.previewUrl,
          },
        ];
      });

      trackMetaPixel("DocumentUploadCompleted", {
        document_type: docType,
        applicant_index: applicantIdx,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Document upload failed";
      setSubmissionError(msg);
    } finally {
      setUploadingSlots((prev) => ({ ...prev, [slotKey]: false }));
    }
  };

  // Checkout submission
  const handleSubmitCheckout = () => {
    setSubmissionError(null);

    if (!contactEmail || !contactPhone) {
      setSubmissionError("Please provide your contact email and UAE phone number in Step 3.");
      setCurrentStep(3);
      return;
    }

    for (let i = 0; i < applicants.length; i++) {
      const app = applicants[i];
      if (!app.fullName.trim() || app.fullName.trim().length < 2) {
        setSubmissionError(`Traveller #${i + 1}: Please enter the full legal name shown on the passport.`);
        setActiveApplicantIndex(i);
        setCurrentStep(3);
        return;
      }
      if (!app.passportNumber.trim()) {
        setSubmissionError(`Traveller #${i + 1}: Please enter the passport number.`);
        setActiveApplicantIndex(i);
        setCurrentStep(3);
        return;
      }
    }

    if (!termsAccepted) {
      setSubmissionError("Please review and accept the terms, conditions and refund policy.");
      return;
    }

    trackMetaPixel("InitiateCheckout", {
      value: pricing.finalPayableAmount,
      currency: "AED",
      applicant_count: pricing.applicantCount,
      application_type: applicationType,
    });

    startSubmission(async () => {
      try {
        const payload = {
          applicationType,
          paymentGateway,
          travelPurpose,
          travelDate,
          primaryContact: {
            email: contactEmail.trim(),
            phone: contactPhone.trim(),
          },
          applicants: applicants.map((a) => ({
            fullName: a.fullName.trim(),
            dateOfBirth: a.dateOfBirth || "1990-01-01",
            gender: a.gender || "Other",
            nationality: a.nationality || eligibilityNationality,
            countryOfResidence: "United Arab Emirates",
            passportNumber: a.passportNumber.trim(),
            passportIssueDate: a.passportIssueDate || "N/A",
            passportExpiryDate: a.passportExpiryDate || "2030-01-01",
            residenceExpiryDate: a.residenceExpiryDate || "2027-01-01",
          })),
          uploadedDocuments: uploadedDocs.map((d) => ({
            documentType: d.documentType,
            filePath: d.filePath,
            fileName: d.fileName,
            fileSize: d.fileSize,
            mimeType: d.mimeType,
          })),
          termsAccepted: true,
        };

        const res = await fetch("/api/saudi-visa/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Checkout failed");
        }

        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error("No payment URL received from checkout gateway.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Checkout submission failed";
        setSubmissionError(msg);
      }
    });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const isEligibleNationality = isNationalityApproved(eligibilityNationality);
  const heroWhatsAppUrl = getSaudiVisaWhatsAppLink("individual", 1);
  const familyWhatsAppUrl = getSaudiVisaWhatsAppLink("family", 3);

  // Exact Saudi Tourist FAQs matching Image 2
  const faqs = [
    {
      q: "Who is eligible for this Saudi Tourist Visa service?",
      a: "This service is specifically catered for UAE residents holding Indian or Pakistani passports. Applicants must hold a valid UAE residence visa (minimum 3 months validity remaining) and a passport with at least 6 months validity. Other nationalities can also submit their details for manual review by our visa processing desk.",
    },
    {
      q: "What is the validity and permitted stay of the visa?",
      a: "The Saudi Tourist Visa is valid for 1 full year from the date of issuance with multiple entries permitted. You may stay up to 90 days per visit across the Kingdom of Saudi Arabia.",
    },
    {
      q: "What documents do I need to apply?",
      a: "You need 4 simple documents: (1) Clear colour copy of your passport bio-data page (minimum 6 months validity), (2) Copy of your valid UAE residence visa (minimum 3 months validity), (3) Copy of your Emirates ID (front & back, minimum 3 months validity), and (4) Recent passport-size photograph with a white background.",
    },
    {
      q: "How long does the application process take?",
      a: "Processing typically takes approximately 2 to 3 working days once all required documents are verified and submitted. Please note that processing times are subject to official Saudi immigration authorities.",
    },
    {
      q: "Can I perform Umrah on this visa?",
      a: "Yes! The 1-Year Multiple Entry Saudi Tourist Visa permits performing Umrah throughout the year, with the exception of the designated restricted Hajj period.",
    },
    {
      q: "How does the 5% Family Discount work?",
      a: "When 3 or more family members apply together in a single application, an automatic 5% discount is applied to each applicant's fee. For example, 3 applicants pay AED 2,137.50 instead of AED 2,250.00 (saving AED 112.50).",
    },
    {
      q: "What payment options are accepted?",
      a: "You can pay securely online via Debit/Credit Card (Visa, Mastercard, Amex) through encrypted Stripe checkout. When available, you can also split your payment into 4 interest-free monthly installments using Tabby.",
    },
    {
      q: "Does applying through Masaar Holidays guarantee visa approval?",
      a: "While Masaar Holidays meticulously verifies your documentation to meet all official standards, final visa issuance and approval decisions rest solely with official Saudi immigration authorities.",
    },
  ];

  const displayDocuments = [
    {
      title: "Valid Passport",
      description: "Minimum 6 months validity from intended travel date. Clear coloured bio-data page.",
    },
    {
      title: "UAE Residence Visa",
      description: "Valid UAE residence permit with at least 3 months remaining validity.",
    },
    {
      title: "Emirates ID",
      description: "Clear copy of front & back of your valid Emirates ID card (min 3 months validity).",
    },
    {
      title: "Passport Photo",
      description: "Recent passport-size photograph with white background taken within the last 6 months.",
    },
  ];

  return (
    <div className="min-h-screen bg-warm-ivory/20 text-masaar-black">
      {/* ─────────────────────────────────────────────────────────
          1. BREADCRUMBS (Matches Image 2)
      ───────────────────────────────────────────────────────── */}
      <div className="bg-warm-ivory/60 border-b border-black/5 py-2.5">
        <Container>
          <Breadcrumbs
            items={[
              { label: "Visa", href: "/visa" },
              { label: "Saudi Tourist Visa" },
            ]}
          />
        </Container>
      </div>

      {/* ─────────────────────────────────────────────────────────
          2. HERO SECTION (Matches Image 2)
      ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-masaar-black py-16 text-white sm:py-24">
        {/* Background Image with Dark Atmospheric Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/trips/package-detail-hero-1.webp"
            alt="Saudi Tourist Visa"
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
              — SAUDI TOURIST VISA —
            </p>

            {/* Headline */}
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Saudi 1-Year Multiple Entry <br className="hidden sm:inline" />
              <span className="font-[family-name:var(--font-display)] italic text-pure-gold text-2xl sm:text-4xl">
                Tourist Visa for UAE Residents
              </span>
            </h1>

            {/* 4 Highlight Badges */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <span className="inline-flex items-center rounded-full border border-pure-gold/40 bg-pure-gold/15 px-3 py-1 text-xs font-semibold text-pure-gold">
                Price: AED 750 / applicant
              </span>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                Validity: 1 Year (Multiple Entry)
              </span>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                Stay: Up to 90 Days / Visit
              </span>
              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
                UAE Residents (Indian & Pakistani Passports)
              </span>
            </div>

            {/* Intro text */}
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              Obtain your 1-Year Multiple Entry Saudi Tourist Visa effortlessly. Specially catered for UAE residents holding Indian or Pakistani passports. Fast ~2-3 working days processing with dedicated expert guidance.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => scrollToSection("packages")}
                className="inline-flex items-center justify-center rounded-md bg-pure-gold px-7 py-3.5 text-sm font-semibold text-masaar-black shadow-lg transition-all hover:bg-light-gold active:scale-95 cursor-pointer"
              >
                Apply Now →
              </button>
              <a
                href={heroWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                Talk to Our Team
              </a>
            </div>

            {/* 3 Trust Badges */}
            <div className="mt-12 grid grid-cols-1 gap-4 border-t border-white/15 pt-8 sm:grid-cols-3">
              <div className="flex items-center justify-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-pure-gold">
                  <ShieldCheck className="size-5" />
                </span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">Trusted Guidance</p>
                  <p className="text-[11px] text-white/60">From application to approval</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-pure-gold">
                  <Lock className="size-5" />
                </span>
                <div className="text-left">
                  <p className="text-xs font-semibold text-white">Secure Online Payment</p>
                  <p className="text-[11px] text-white/60">Safe & 256-bit encrypted</p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-pure-gold">
                  <Clock className="size-5" />
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

      {/* ─────────────────────────────────────────────────────────
          3. STICKY IN-PAGE NAVIGATION (Matches Image 2)
      ───────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 border-b border-black/10 bg-white/95 backdrop-blur-md">
        <Container>
          <div className="flex items-center justify-center gap-2 overflow-x-auto py-3 sm:gap-4 scrollbar-none">
            <button
              onClick={() => scrollToSection("overview")}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-masaar-black/80 hover:bg-warm-ivory hover:text-masaar-black cursor-pointer"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection("packages")}
              className="rounded-full bg-pure-gold/15 px-4 py-1.5 text-xs font-semibold text-deep-gold hover:bg-pure-gold/25 cursor-pointer"
            >
              Visa Options
            </button>
            <button
              onClick={() => scrollToSection("apply-flow")}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-masaar-black/80 hover:bg-warm-ivory hover:text-masaar-black cursor-pointer"
            >
              Apply Online
            </button>
            <button
              onClick={() => scrollToSection("documents")}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-masaar-black/80 hover:bg-warm-ivory hover:text-masaar-black cursor-pointer"
            >
              Documents
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-masaar-black/80 hover:bg-warm-ivory hover:text-masaar-black cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection("important-info")}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-masaar-black/80 hover:bg-warm-ivory hover:text-masaar-black cursor-pointer"
            >
              Important Info
            </button>
            <button
              onClick={() => scrollToSection("faqs")}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-masaar-black/80 hover:bg-warm-ivory hover:text-masaar-black cursor-pointer"
            >
              FAQs
            </button>
          </div>
        </Container>
      </div>

      {/* ─────────────────────────────────────────────────────────
          4. ABOUT SECTION (Matches Image 2)
      ───────────────────────────────────────────────────────── */}
      <section id="overview" className="scroll-mt-16 py-16 sm:py-20">
        <Container>
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-deep-gold">
                — ABOUT SAUDI TOURIST VISA —
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
                About Saudi Tourist Visa
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-masaar-black/75 sm:text-base">
                We help you apply for your 1-Year Multiple Entry Saudi Tourist Visa online with a smooth, reliable and transparent process. Specially designed for UAE residents holding Indian or Pakistani passports, ensuring accurate documentation and timely submission to authorities.
              </p>

              {/* 2x2 Feature Pills Grid */}
              <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-xs">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                    <FileCheck className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-masaar-black">1 Year Multiple Entry</p>
                    <p className="text-[11px] text-masaar-black/60">Stay up to 90 days per visit</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-xs">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                    <Clock className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-masaar-black">Fast processing</p>
                    <p className="text-[11px] text-masaar-black/60">~2-3 working days turnaround</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-xs">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-masaar-black">Expert review</p>
                    <p className="text-[11px] text-masaar-black/60">Documents checked by specialists</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-lg border border-black/5 bg-white p-4 shadow-xs">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                    <CheckCircle2 className="size-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-masaar-black">Umrah & Tourism</p>
                    <p className="text-[11px] text-masaar-black/60">Perform Umrah throughout the year</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side guide card matching Image 2 */}
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-black/10 bg-masaar-black shadow-lg">
              <Image
                src="/trips/package-detail-hero-1.webp"
                alt="Saudi Tourist Visa Guide"
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
                  <p className="text-xs font-semibold">Saudi Tourist Visa Guidance</p>
                  <p className="text-[10px] text-white/70">Watch our step-by-step application walkthrough</p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────
          5. VISA OPTIONS & DISCOUNT (Matches Image 2)
      ───────────────────────────────────────────────────────── */}
      <section id="packages" className="scroll-mt-16 bg-white py-16 sm:py-24">
        <Container>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
              Choose Your Application Type
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-4xl">
              Saudi 1-Year Multiple Entry Tourist Visa
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-xs text-masaar-black/60 sm:text-sm">
              Approved visa packages for UAE residents holding Indian or Pakistani passports. Select individual or apply together as a family to enjoy 5% savings.
            </p>
          </div>

          <div className="mt-12 mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
            {/* Individual Card */}
            <div
              className={`relative flex flex-col justify-between rounded-xl border bg-white p-7 shadow-sm transition-all hover:shadow-md ${
                applicationType === "individual"
                  ? "border-pure-gold ring-2 ring-pure-gold/25"
                  : "border-black/10"
              }`}
            >
              <div>
                <span className="rounded-full bg-black/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-masaar-black/70">
                  Individual Application
                </span>
                <h3 className="mt-4 font-semibold text-masaar-black text-lg">
                  Individual Saudi Tourist Visa
                </h3>
                <p className="mt-1 text-xs text-masaar-black/60">
                  For solo travellers applying with their own UAE residency documents.
                </p>

                <div className="mt-5 border-b border-black/5 pb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-masaar-black/70">Approved Rate</span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                      Fixed Price
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-masaar-black">
                      AED 750
                    </span>
                    <span className="text-xs text-masaar-black/60 font-medium">/ applicant</span>
                  </div>
                  <p className="mt-2 rounded-md bg-warm-ivory px-2.5 py-1 text-[11px] font-medium text-masaar-black/75 border border-black/5">
                    💳 Or 4 interest-free payments of AED 187.50 with Tabby
                  </p>
                </div>

                <ul className="mt-5 space-y-2.5 text-xs text-masaar-black/80">
                  <li className="flex items-center gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>1 Year validity with multiple entries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>Up to 90 days stay per visit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>Valid for Tourism & Umrah</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>Fast 2-3 working days processing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>Dedicated visa specialist review</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <button
                  onClick={() => {
                    handleSelectIndividual();
                    scrollToSection("apply-flow");
                  }}
                  className="inline-flex w-full items-center justify-center rounded-md bg-masaar-black py-3.5 px-4 text-xs font-semibold text-white shadow transition-all hover:bg-black/90 active:scale-95 cursor-pointer"
                >
                  Apply Individual (AED 750) →
                </button>
              </div>
            </div>

            {/* Family Card */}
            <div
              className={`relative flex flex-col justify-between rounded-xl border bg-white p-7 shadow-sm transition-all hover:shadow-md ${
                applicationType === "family"
                  ? "border-pure-gold ring-2 ring-pure-gold/40"
                  : "border-black/10"
              }`}
            >
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-pure-gold px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-masaar-black shadow-sm">
                5% Family Discount (3+ Applicants)
              </span>

              <div>
                <span className="rounded-full bg-pure-gold/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-deep-gold">
                  Family & Group Application
                </span>
                <h3 className="mt-4 font-semibold text-masaar-black text-lg">
                  Family Saudi Tourist Visa
                </h3>
                <p className="mt-1 text-xs text-masaar-black/60">
                  Apply together for 3 or more travellers and save 5% on each applicant.
                </p>

                <div className="mt-5 border-b border-black/5 pb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-masaar-black/70">Discounted Rate</span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                      Save 5%
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="font-[family-name:var(--font-display)] text-4xl font-bold text-masaar-black">
                      AED 712.50
                    </span>
                    <span className="text-xs text-masaar-black/60 font-medium">/ applicant (effective)</span>
                  </div>
                  <p className="mt-2 rounded-md bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-900 border border-emerald-200">
                    🏷️ 3 Applicants: AED 2,137.50 total (Save AED 112.50)
                  </p>
                </div>

                <ul className="mt-5 space-y-2.5 text-xs text-masaar-black/80">
                  <li className="flex items-center gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>All 1-Year Multiple Entry benefits included</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>Automatic 5% discount for 3 or more travellers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>Single consolidated tracking reference number</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>Dedicated family documentation review coordinator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-pure-gold/20 text-deep-gold">
                      ✓
                    </span>
                    <span>One unified checkout and payment</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <button
                  onClick={() => {
                    handleSelectFamily();
                    scrollToSection("apply-flow");
                  }}
                  className="inline-flex w-full items-center justify-center rounded-md bg-pure-gold py-3.5 px-4 text-xs font-semibold text-masaar-black shadow transition-all hover:bg-light-gold active:scale-95 cursor-pointer"
                >
                  Apply as Family (Save 5%) →
                </button>
              </div>
            </div>
          </div>

          {/* Price & Eligibility Notice matching Image 2 */}
          <div className="mt-12 rounded-xl border border-pure-gold/30 bg-warm-ivory p-5 sm:p-6 max-w-4xl mx-auto">
            <div className="flex items-start gap-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold shadow-sm">
                <AlertCircle className="size-5" />
              </span>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-deep-gold">
                  Price & Eligibility Notice
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-masaar-black/75">
                  This service is exclusively available for UAE residents holding Indian or Pakistani passports (with minimum 3 months UAE residence and 6 months passport validity). Transparent fees are shown before checkout. Other nationalities can submit for manual verification.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────
          6. INTERACTIVE APPLICATION FORM (#apply-flow)
          (Housed in a luxury Masaar card container)
      ───────────────────────────────────────────────────────── */}
      <section id="apply-flow" className="scroll-mt-16 py-16 sm:py-20 bg-warm-ivory/40 border-y border-black/5">
        <Container>
          <div className="mx-auto max-w-3xl">
            {/* Header */}
            <div className="text-center mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-deep-gold">
                Online Application Portal
              </p>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
                {applicationType === "family"
                  ? `Family Visa Application (${applicantCount} Travellers)`
                  : "Individual Visa Application"}
              </h2>
              <p className="mt-1 text-xs text-masaar-black/60">
                Complete your application details below in 4 easy steps.
              </p>
            </div>

            {/* Step Progress Pills */}
            <div className="mb-8 grid grid-cols-4 gap-2 text-center text-xs">
              {[
                { num: 1, label: "Eligibility" },
                { num: 2, label: "Plan & Travellers" },
                { num: 3, label: "Documents" },
                { num: 4, label: "Payment" },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                  className={`rounded-lg py-2.5 px-2 transition-all cursor-pointer ${
                    currentStep === s.num
                      ? "bg-masaar-black text-white font-bold shadow-sm"
                      : currentStep > s.num
                      ? "bg-pure-gold/20 text-deep-gold font-semibold"
                      : "bg-white text-masaar-black/40 border border-black/5"
                  }`}
                >
                  <span className="block text-[11px] font-mono">Step {s.num}</span>
                  <span className="truncate block font-medium">{s.label}</span>
                </button>
              ))}
            </div>

            {/* Submission Error Banner */}
            {submissionError && (
              <div className="mb-6 rounded-lg bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800 flex items-start gap-3">
                <AlertCircle className="size-5 shrink-0 text-rose-600 mt-0.5" />
                <p className="flex-1">{submissionError}</p>
              </div>
            )}

            {/* Card Form Wrapper */}
            <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-10 shadow-sm">
              {/* STEP 1: ELIGIBILITY CHECK */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-black/5 pb-4">
                    <h3 className="font-semibold text-masaar-black text-base">
                      Step 1: Verify Your Eligibility
                    </h3>
                    <p className="text-xs text-masaar-black/60 mt-0.5">
                      Confirm passport and UAE residency requirements before proceeding.
                    </p>
                  </div>

                  {/* Nationality selector */}
                  <div>
                    <label className="block text-xs font-semibold text-masaar-black mb-2">
                      Applicant Passport Nationality
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {["India", "Pakistan", "Other"].map((nat) => (
                        <button
                          key={nat}
                          type="button"
                          onClick={() => {
                            setEligibilityNationality(nat);
                            trackMetaPixel("EligibilityCheck", { nationality: nat });
                          }}
                          className={`rounded-lg border p-3 text-xs font-semibold transition-all cursor-pointer ${
                            eligibilityNationality === nat
                              ? "border-pure-gold bg-pure-gold/15 text-masaar-black ring-1 ring-pure-gold"
                              : "border-black/10 bg-white text-masaar-black/70 hover:border-black/30"
                          }`}
                        >
                          {nat === "India" ? "🇮🇳 Indian" : nat === "Pakistan" ? "🇵🇰 Pakistani" : "🌍 Other"}
                        </button>
                      ))}
                    </div>

                    {eligibilityNationality === "Other" && (
                      <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                        <p className="font-bold">Manual Verification Option:</p>
                        <p className="mt-1 text-[11px] text-amber-800">
                          Non-Indian/Pakistani nationalities require manual desk evaluation. You may submit your application for review, or message our specialist directly.
                        </p>
                        <a
                          href={heroWhatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 underline"
                        >
                          Chat on WhatsApp for instant evaluation →
                        </a>
                      </div>
                    )}
                  </div>

                  {/* UAE Residency checklist */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 rounded-lg border border-black/10 p-3.5 hover:bg-neutral-50/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUaeResident}
                        onChange={(e) => setIsUaeResident(e.target.checked)}
                        className="mt-0.5 size-4 rounded text-pure-gold focus:ring-pure-gold"
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-masaar-black">Currently Residing in the UAE</p>
                        <p className="text-masaar-black/60 text-[11px]">Hold a valid UAE residency status with Emirates ID.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-black/10 p-3.5 hover:bg-neutral-50/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={residenceValidMonths}
                        onChange={(e) => setResidenceValidMonths(e.target.checked)}
                        className="mt-0.5 size-4 rounded text-pure-gold focus:ring-pure-gold"
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-masaar-black">UAE Residence & Emirates ID Validity (3+ Months)</p>
                        <p className="text-masaar-black/60 text-[11px]">Both documents must have at least 3 months validity from today.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 rounded-lg border border-black/10 p-3.5 hover:bg-neutral-50/50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={passportValidMonths}
                        onChange={(e) => setPassportValidMonths(e.target.checked)}
                        className="mt-0.5 size-4 rounded text-pure-gold focus:ring-pure-gold"
                      />
                      <div className="text-xs">
                        <p className="font-semibold text-masaar-black">Passport Validity (6+ Months)</p>
                        <p className="text-masaar-black/60 text-[11px]">Original passport must have at least 6 months validity from intended travel.</p>
                      </div>
                    </label>
                  </div>

                  {/* Travel details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black mb-1">
                        Purpose of Travel
                      </label>
                      <select
                        value={travelPurpose}
                        onChange={(e) => setTravelPurpose(e.target.value)}
                        className="w-full rounded-lg border border-black/15 bg-white p-2.5 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      >
                        <option value="Umrah">Umrah Pilgrimage</option>
                        <option value="Tourism">Tourism & Sightseeing</option>
                        <option value="Family Visit">Visiting Family / Friends</option>
                        <option value="Business">Business / Conference</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black mb-1">
                        Intended Travel Date
                      </label>
                      <input
                        type="date"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        className="w-full rounded-lg border border-black/15 bg-white p-2.5 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!isUaeResident || !passportValidMonths || !residenceValidMonths}
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center gap-2 rounded-md bg-pure-gold px-6 py-3 text-xs font-semibold text-masaar-black shadow hover:bg-light-gold disabled:opacity-50 cursor-pointer"
                    >
                      Continue to Step 2 →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: CHOOSE APPLICATION OPTION & APPLICANTS COUNT */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-black/5 pb-4">
                    <h3 className="font-semibold text-masaar-black text-base">
                      Step 2: Select Application Option
                    </h3>
                    <p className="text-xs text-masaar-black/60 mt-0.5">
                      Choose individual or family application. Applying for 3 or more travellers automatically applies a 5% discount.
                    </p>
                  </div>

                  {/* Type buttons */}
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={handleSelectIndividual}
                      className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${
                        applicationType === "individual"
                          ? "border-pure-gold bg-pure-gold/15 ring-2 ring-pure-gold/30"
                          : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <User className="size-5 text-deep-gold mb-2" />
                      <p className="text-xs font-bold text-masaar-black">Individual</p>
                      <p className="text-[11px] text-masaar-black/60 mt-0.5">1 Applicant · AED 750</p>
                    </button>

                    <button
                      type="button"
                      onClick={handleSelectFamily}
                      className={`relative rounded-xl border p-4 text-left transition-all cursor-pointer ${
                        applicationType === "family"
                          ? "border-pure-gold bg-pure-gold/15 ring-2 ring-pure-gold/30"
                          : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <span className="absolute -top-2 right-2 rounded-full bg-pure-gold px-2 py-0.5 text-[9px] font-bold uppercase text-masaar-black">
                        Save 5%
                      </span>
                      <Users className="size-5 text-deep-gold mb-2" />
                      <p className="text-xs font-bold text-masaar-black">Family / Group</p>
                      <p className="text-[11px] text-masaar-black/60 mt-0.5">3+ Travellers · 5% Discount</p>
                    </button>
                  </div>

                  {/* Family applicant count stepper */}
                  {applicationType === "family" && (
                    <div className="rounded-xl border border-pure-gold/30 bg-warm-ivory/60 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-masaar-black">Number of Travellers</p>
                          <p className="text-[11px] text-masaar-black/60">Minimum 3 applicants for family discount</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleUpdateFamilyCount(applicantCount - 1)}
                            disabled={applicantCount <= 3}
                            className="size-8 rounded-full border border-black/20 bg-white flex items-center justify-center text-masaar-black disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="font-bold text-sm w-4 text-center">{applicantCount}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateFamilyCount(applicantCount + 1)}
                            disabled={applicantCount >= 10}
                            className="size-8 rounded-full border border-black/20 bg-white flex items-center justify-center text-masaar-black disabled:opacity-30 cursor-pointer"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-black/10 pt-3 flex items-center justify-between text-xs">
                        <span className="text-masaar-black/70">5% Family Discount:</span>
                        <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          -AED {pricing.discountAmount.toFixed(2)} applied
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Live Price Summary Bar */}
                  <div className="rounded-xl bg-neutral-50 p-4 border border-black/5 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-masaar-black/60 uppercase tracking-wider font-semibold">
                        Payable Amount ({effectiveCount} {effectiveCount === 1 ? "Applicant" : "Applicants"})
                      </p>
                      <p className="text-xl font-bold font-[family-name:var(--font-display)] text-masaar-black">
                        AED {pricing.finalPayableAmount.toFixed(2)}
                      </p>
                    </div>
                    {pricing.discountAmount > 0 && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        You save AED {pricing.discountAmount.toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="rounded-md border border-black/20 px-5 py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/5 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="inline-flex items-center gap-2 rounded-md bg-pure-gold px-6 py-2.5 text-xs font-semibold text-masaar-black shadow hover:bg-light-gold cursor-pointer"
                    >
                      Continue to Documents →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: TRAVELLER DETAILS & DOCUMENT UPLOAD */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-black/5 pb-4">
                    <h3 className="font-semibold text-masaar-black text-base">
                      Step 3: Traveller Details & Documents
                    </h3>
                    <p className="text-xs text-masaar-black/60 mt-0.5">
                      Enter passport data and upload clear copies of passport, UAE residence visa, and Emirates ID.
                    </p>
                  </div>

                  {/* Primary contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-warm-ivory/50 p-4 border border-black/5">
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black mb-1">
                        Primary Contact Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full rounded-lg border border-black/15 bg-white p-2.5 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black mb-1">
                        UAE Mobile Number (WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        required
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+971 50 123 4567"
                        className="w-full rounded-lg border border-black/15 bg-white p-2.5 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Traveller tabs (if multi) */}
                  {applicants.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                      {applicants.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveApplicantIndex(idx)}
                          className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                            activeApplicantIndex === idx
                              ? "bg-masaar-black text-white shadow-xs"
                              : "bg-neutral-100 text-masaar-black/70 hover:bg-neutral-200"
                          }`}
                        >
                          Traveller {idx + 1} {idx === 0 ? "(Lead)" : ""}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Active traveller inputs */}
                  {applicants[activeApplicantIndex] && (() => {
                    const app = applicants[activeApplicantIndex];
                    const idx = activeApplicantIndex;
                    const passDoc = uploadedDocs.find((d) => d.applicantIndex === idx && d.documentType === "passport");
                    const photoDoc = uploadedDocs.find((d) => d.applicantIndex === idx && d.documentType === "photo");
                    const eidDoc = uploadedDocs.find((d) => d.applicantIndex === idx && d.documentType === "emirates_id");

                    return (
                      <div className="space-y-4 rounded-xl border border-black/10 p-4">
                        <div className="flex items-center justify-between border-b border-black/5 pb-2">
                          <span className="text-xs font-bold text-masaar-black">
                            Traveller {idx + 1} Personal Information
                          </span>
                          <span className="text-[11px] text-masaar-black/50">
                            Must match passport bio page exactly
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-semibold text-masaar-black mb-1">
                              Full Name (As on Passport) *
                            </label>
                            <input
                              type="text"
                              required
                              value={app.fullName}
                              onChange={(e) => handleApplicantChange(idx, "fullName", e.target.value)}
                              placeholder="e.g. MOHAMMED AHMAD"
                              className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs uppercase text-masaar-black focus:border-pure-gold focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-masaar-black mb-1">
                              Nationality *
                            </label>
                            <select
                              value={app.nationality}
                              onChange={(e) => handleApplicantChange(idx, "nationality", e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                            >
                              <option value="India">India</option>
                              <option value="Pakistan">Pakistan</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="United States">United States</option>
                              <option value="Canada">Canada</option>
                              <option value="Other">Other (Manual Review)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-masaar-black mb-1">
                              Date of Birth *
                            </label>
                            <input
                              type="date"
                              required
                              value={app.dateOfBirth}
                              onChange={(e) => handleApplicantChange(idx, "dateOfBirth", e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-masaar-black mb-1">
                              Gender
                            </label>
                            <select
                              value={app.gender}
                              onChange={(e) => handleApplicantChange(idx, "gender", e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-masaar-black mb-1">
                              Passport Number *
                            </label>
                            <input
                              type="text"
                              required
                              value={app.passportNumber}
                              onChange={(e) => handleApplicantChange(idx, "passportNumber", e.target.value)}
                              placeholder="e.g. Z1234567"
                              className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs uppercase font-mono text-masaar-black focus:border-pure-gold focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-masaar-black mb-1">
                              Passport Expiry Date *
                            </label>
                            <input
                              type="date"
                              required
                              value={app.passportExpiryDate}
                              onChange={(e) => handleApplicantChange(idx, "passportExpiryDate", e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-masaar-black mb-1">
                              UAE Residence Expiry *
                            </label>
                            <input
                              type="date"
                              required
                              value={app.residenceExpiryDate}
                              onChange={(e) => handleApplicantChange(idx, "residenceExpiryDate", e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-masaar-black mb-1">
                              Emirates ID Expiry Date *
                            </label>
                            <input
                              type="date"
                              required
                              value={app.emiratesIdExpiryDate}
                              onChange={(e) => handleApplicantChange(idx, "emiratesIdExpiryDate", e.target.value)}
                              className="w-full rounded-lg border border-black/15 bg-white p-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                            />
                          </div>
                        </div>

                        {/* Document Uploads for this traveller */}
                        <div className="pt-3 border-t border-black/5">
                          <p className="text-xs font-bold text-masaar-black mb-2">
                            Upload Documents for Traveller {idx + 1}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Passport */}
                            <div className="rounded-lg border border-dashed border-black/20 p-3 text-center bg-neutral-50/50">
                              <span className="block text-[11px] font-semibold text-masaar-black">Passport Copy</span>
                              <span className="block text-[10px] text-masaar-black/50 mb-2">PDF / JPG (Max 10MB)</span>
                              {passDoc ? (
                                <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                                  <Check className="size-3.5" /> Uploaded
                                </p>
                              ) : (
                                <label className="inline-block cursor-pointer rounded bg-white border border-black/15 px-3 py-1 text-[11px] font-semibold text-masaar-black hover:bg-neutral-100">
                                  {uploadingSlots[`${idx}_passport`] ? "Uploading..." : "Select File"}
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleFileUpload(idx, "passport", f);
                                    }}
                                  />
                                </label>
                              )}
                            </div>

                            {/* Photo */}
                            <div className="rounded-lg border border-dashed border-black/20 p-3 text-center bg-neutral-50/50">
                              <span className="block text-[11px] font-semibold text-masaar-black">Passport Photo</span>
                              <span className="block text-[10px] text-masaar-black/50 mb-2">White Background</span>
                              {photoDoc ? (
                                <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                                  <Check className="size-3.5" /> Uploaded
                                </p>
                              ) : (
                                <label className="inline-block cursor-pointer rounded bg-white border border-black/15 px-3 py-1 text-[11px] font-semibold text-masaar-black hover:bg-neutral-100">
                                  {uploadingSlots[`${idx}_photo`] ? "Uploading..." : "Select File"}
                                  <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleFileUpload(idx, "photo", f);
                                    }}
                                  />
                                </label>
                              )}
                            </div>

                            {/* Emirates ID */}
                            <div className="rounded-lg border border-dashed border-black/20 p-3 text-center bg-neutral-50/50">
                              <span className="block text-[11px] font-semibold text-masaar-black">Emirates ID</span>
                              <span className="block text-[10px] text-masaar-black/50 mb-2">Front & Back</span>
                              {eidDoc ? (
                                <p className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                                  <Check className="size-3.5" /> Uploaded
                                </p>
                              ) : (
                                <label className="inline-block cursor-pointer rounded bg-white border border-black/15 px-3 py-1 text-[11px] font-semibold text-masaar-black hover:bg-neutral-100">
                                  {uploadingSlots[`${idx}_emirates_id`] ? "Uploading..." : "Select File"}
                                  <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    className="hidden"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleFileUpload(idx, "emirates_id", f);
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="rounded-md border border-black/20 px-5 py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/5 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(4)}
                      className="inline-flex items-center gap-2 rounded-md bg-pure-gold px-6 py-2.5 text-xs font-semibold text-masaar-black shadow hover:bg-light-gold cursor-pointer"
                    >
                      Review & Checkout →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & PAYMENT */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="border-b border-black/5 pb-4">
                    <h3 className="font-semibold text-masaar-black text-base">
                      Step 4: Review Application & Secure Checkout
                    </h3>
                    <p className="text-xs text-masaar-black/60 mt-0.5">
                      Confirm order breakdown and proceed to encrypted payment processing.
                    </p>
                  </div>

                  {/* Summary table */}
                  <div className="rounded-xl border border-black/10 divide-y divide-black/5 text-xs">
                    <div className="p-3.5 flex justify-between">
                      <span className="text-masaar-black/70">Application Type</span>
                      <span className="font-semibold text-masaar-black capitalize">{applicationType}</span>
                    </div>
                    <div className="p-3.5 flex justify-between">
                      <span className="text-masaar-black/70">Number of Travellers</span>
                      <span className="font-semibold text-masaar-black">{effectiveCount}</span>
                    </div>
                    <div className="p-3.5 flex justify-between">
                      <span className="text-masaar-black/70">Base Price ({effectiveCount} × AED 750)</span>
                      <span className="font-semibold text-masaar-black">AED {pricing.subtotal.toFixed(2)}</span>
                    </div>
                    {pricing.discountAmount > 0 && (
                      <div className="p-3.5 flex justify-between bg-emerald-50/60 text-emerald-800">
                        <span className="font-semibold">5% Family Discount Savings</span>
                        <span className="font-bold">-AED {pricing.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="p-3.5 flex justify-between bg-neutral-50 text-sm">
                      <span className="font-bold text-masaar-black">Total Amount Payable</span>
                      <span className="font-bold font-[family-name:var(--font-display)] text-lg text-masaar-black">
                        AED {pricing.finalPayableAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Payment option */}
                  <div>
                    <label className="block text-xs font-semibold text-masaar-black mb-2">
                      Payment Method
                    </label>
                    <div className="rounded-xl border border-pure-gold bg-pure-gold/5 p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="size-9 rounded-lg bg-pure-gold/20 flex items-center justify-center text-deep-gold">
                          <Lock className="size-4" />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-masaar-black">Credit / Debit Card (Stripe)</p>
                          <p className="text-[11px] text-masaar-black/60">Encrypted 256-bit checkout via Visa, Mastercard, Amex</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                        Secure
                      </span>
                    </div>
                  </div>

                  {/* Terms acceptance */}
                  <label className="flex items-start gap-3 pt-2 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 size-4 rounded text-pure-gold focus:ring-pure-gold"
                    />
                    <span className="text-[11px] text-masaar-black/75 leading-relaxed">
                      I agree to the{" "}
                      <Link href="/terms-conditions" target="_blank" className="font-semibold text-deep-gold underline">
                        Terms & Conditions
                      </Link>
                      ,{" "}
                      <Link href="/privacy-policy" target="_blank" className="font-semibold text-deep-gold underline">
                        Privacy Policy
                      </Link>
                      , and understand that visa approval decisions rest solely with official immigration authorities.
                    </span>
                  </label>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="rounded-md border border-black/20 px-5 py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/5 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !termsAccepted}
                      onClick={handleSubmitCheckout}
                      className="inline-flex items-center gap-2 rounded-md bg-pure-gold px-8 py-3.5 text-xs font-semibold text-masaar-black shadow-lg hover:bg-light-gold disabled:opacity-50 cursor-pointer"
                    >
                      <Lock className="size-4" />
                      {isSubmitting ? "Initiating Secure Checkout..." : `Pay AED ${pricing.finalPayableAmount.toFixed(2)} →`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────
          7. DOCUMENTS REQUIRED SECTION (Matches Image 2)
      ───────────────────────────────────────────────────────── */}
      <section id="documents" className="scroll-mt-16 py-16 sm:py-20">
        <Container>
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl">
              Documents Required
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-xs text-masaar-black/60 sm:text-sm">
              Prepare the following documents to complete your Saudi Tourist Visa online application.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {displayDocuments.map((doc, idx) => (
              <div key={idx} className="rounded-xl border border-black/10 bg-white p-6 shadow-xs">
                <span className="flex size-11 items-center justify-center rounded-lg bg-warm-ivory text-deep-gold">
                  <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </span>
                <h3 className="mt-4 font-semibold text-masaar-black text-sm">{doc.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-masaar-black/60">{doc.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────
          8. HOW IT WORKS SECTION (Matches Image 2)
      ───────────────────────────────────────────────────────── */}
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
              Apply for your Saudi 1-Year Multiple Entry Tourist Visa in a few easy steps.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pure-gold text-sm font-bold text-masaar-black shadow-md">
                1
              </span>
              <h3 className="mt-4 font-semibold text-masaar-black text-sm">Choose Your Package</h3>
              <p className="mt-1 text-xs text-masaar-black/60">Select individual or family application (5% off).</p>
            </div>

            <div className="relative text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pure-gold text-sm font-bold text-masaar-black shadow-md">
                2
              </span>
              <h3 className="mt-4 font-semibold text-masaar-black text-sm">Fill in the Details</h3>
              <p className="mt-1 text-xs text-masaar-black/60">Complete traveller details and upload required documents.</p>
            </div>

            <div className="relative text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-pure-gold text-sm font-bold text-masaar-black shadow-md">
                3
              </span>
              <h3 className="mt-4 font-semibold text-masaar-black text-sm">Secure Payment</h3>
              <p className="mt-1 text-xs text-masaar-black/60">Pay online safely via 256-bit encrypted card checkout.</p>
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

      {/* ─────────────────────────────────────────────────────────
          9. IMPORTANT INFORMATION SECTION (Matches Image 2)
      ───────────────────────────────────────────────────────── */}
      <section id="important-info" className="scroll-mt-16 py-12">
        <Container>
          <div className="rounded-xl border border-pure-gold/30 bg-warm-ivory p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-deep-gold shadow-sm">
                <AlertCircle className="size-5" />
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-deep-gold">
                  Important Information
                </h3>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-masaar-black/75 sm:text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-pure-gold">•</span>
                    <span>Visa requirements, processing times and government fees are subject to official immigration regulations.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pure-gold">•</span>
                    <span>Holders of this visa may perform Umrah throughout the year except during the restricted Hajj period.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-pure-gold">•</span>
                    <span>Masaar Holidays facilitates your visa application with expert document verification, but final approval rests solely with Saudi authorities.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* ─────────────────────────────────────────────────────────
          10. FREQUENTLY ASKED QUESTIONS (Matches Image 2)
      ───────────────────────────────────────────────────────── */}
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
              Find clear answers to common questions about Saudi Tourist Visa applications.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl divide-y divide-black/5">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="flex w-full items-center justify-between text-left font-semibold text-masaar-black text-sm transition-colors hover:text-deep-gold cursor-pointer"
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

      {/* ─────────────────────────────────────────────────────────
          11. SPEAK TO OUR VISA EXPERTS (Matches Image 2)
      ───────────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-black/5 py-16 sm:py-20">
        <Container>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-warm-ivory via-white to-warm-ivory p-8 sm:p-12 lg:p-14 border border-black/10 shadow-xs">
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
                    href={heroWhatsAppUrl}
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

      {/* ─────────────────────────────────────────────────────────
          12. THOUGHTFUL SERVICES FOR EVERY PART OF YOUR JOURNEY
          (Matches Image 2)
      ───────────────────────────────────────────────────────── */}
      <CrossLinkServices exclude="visa" />

      {/* ─────────────────────────────────────────────────────────
          13. STICKY MOBILE CTA BAR (Matches Image 2)
      ───────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/10 bg-white/95 p-3.5 backdrop-blur-md sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-masaar-black/60">From</p>
            <p className="text-sm font-bold text-masaar-black">AED 750 <span className="text-[10px] font-normal text-masaar-black/60">/ applicant</span></p>
          </div>
          <button
            onClick={() => scrollToSection("packages")}
            className="rounded-md bg-pure-gold px-5 py-2.5 text-xs font-semibold text-masaar-black shadow-md hover:bg-light-gold cursor-pointer"
          >
            Apply Online
          </button>
        </div>
      </div>
    </div>
  );
}
