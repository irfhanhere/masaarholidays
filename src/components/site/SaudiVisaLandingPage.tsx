"use client";

import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { FaqSchema } from "@/components/site/FaqSchema";
import { Container } from "@/components/site/Container";
import { CrossLinkServices } from "@/components/site/CrossLinkServices";
import { Price } from "@/components/site/Price";
import { CONTACT, buildWhatsAppLink } from "@/lib/contact";
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
  Calendar,
  CreditCard,
  FileText,
  ArrowRight,
} from "./saudi-visa-icons";
import {
  calculateSaudiVisaPricing,
  isNationalityApproved,
  validateApplicantEligibility,
  getSaudiVisaWhatsAppLink,
  CONFIRMED_10_NATIONALITIES,
  type PricingBreakdown,
} from "@/lib/data/saudi-visa-settings";
import { trackMetaPixel } from "@/lib/analytics/meta-pixel";

type VisaDocType = "passport" | "emirates_id_front" | "emirates_id_back" | "photo" | "additional";

interface UploadedDoc {
  applicantIndex: number;
  documentType: VisaDocType;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  previewUrl?: string | null;
}

interface ApplicantFormData {
  fullName: string;
  nationality: string;
  emiratesIdExpiryDate: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  residenceExpiryDate?: string;
  dateOfBirth?: string;
  gender?: string;
}

const EMPTY_APPLICANT: ApplicantFormData = {
  fullName: "",
  nationality: "India",
  emiratesIdExpiryDate: "",
  passportNumber: "",
  passportExpiryDate: "",
  residenceExpiryDate: "",
  dateOfBirth: "",
  gender: "Male",
};

const DOCUMENT_SLOTS: Array<{
  type: VisaDocType;
  title: string;
  mandatory: boolean;
  description: string;
  accept: string;
}> = [
    {
      type: "passport",
      title: "Passport Copy",
      mandatory: true,
      description: "Clear full-page color copy of passport bio-data page (minimum 6 months validity).",
      accept: ".jpg,.jpeg,.png,.webp,.pdf",
    },
    {
      type: "emirates_id_front",
      title: "Emirates ID — Front",
      mandatory: true,
      description: "Color photo or scan of the front of your valid Emirates ID card.",
      accept: ".jpg,.jpeg,.png,.webp,.pdf",
    },
    {
      type: "emirates_id_back",
      title: "Emirates ID — Back",
      mandatory: true,
      description: "Color photo or scan of the back of your valid Emirates ID card.",
      accept: ".jpg,.jpeg,.png,.webp,.pdf",
    },
    {
      type: "photo",
      title: "Passport-size Photo",
      mandatory: true,
      description: "Recent color photograph with a white background taken within last 6 months.",
      accept: ".jpg,.jpeg,.png,.webp",
    },
    {
      type: "additional",
      title: "Additional Documents",
      mandatory: false,
      description: "Optional: Flight ticket, hotel booking, or previous GCC/Saudi visas.",
      accept: ".jpg,.jpeg,.png,.webp,.pdf",
    },
  ];

export function SaudiVisaLandingPage() {
  const [applicationType, setApplicationType] = useState<"individual" | "family">("individual");
  const [applicantCount, setApplicantCount] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Step 1: Details fields
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [travelDate, setTravelDate] = useState<string>("");
  const [travelPurpose, setTravelPurpose] = useState<string>("Umrah / Tourism");

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

  // Active applicant tab for family applications
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
    setApplicants((prev) => [prev[0] || { ...EMPTY_APPLICANT, nationality: "India" }]);
    trackMetaPixel("ApplicationStarted", { application_type: "individual", applicant_count: 1 });
    setCurrentStep(1);
  };

  const handleSelectFamily = () => {
    setApplicationType("family");
    const count = 3;
    setApplicantCount(count);
    setApplicants((prev) => {
      const next = [...prev];
      while (next.length < count) {
        next.push({ ...EMPTY_APPLICANT, nationality: "India" });
      }
      return next.slice(0, count);
    });
    trackMetaPixel("ApplicationStarted", { application_type: "family", applicant_count: count });
    setCurrentStep(1);
  };

  const handleUpdateFamilyCount = (newCount: number) => {
    if (newCount < 3) return;
    setApplicantCount(newCount);
    setApplicants((prev) => {
      const next = [...prev];
      if (newCount > next.length) {
        for (let i = next.length; i < newCount; i++) {
          next.push({ ...EMPTY_APPLICANT, nationality: "India" });
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
  const handleFileUpload = async (applicantIdx: number, docType: VisaDocType, file: File) => {
    const slotKey = `${applicantIdx}_${docType}`;
    setUploadingSlots((prev) => ({ ...prev, [slotKey]: true }));
    setSubmissionError(null);

    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error("File exceeds 10 MB maximum size limit.");
      }

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

  const handleRemoveDoc = (applicantIdx: number, docType: VisaDocType) => {
    setUploadedDocs((prev) =>
      prev.filter((d) => !(d.applicantIndex === applicantIdx && d.documentType === docType))
    );
  };

  // Step 1 Validation
  const handleValidateStep1 = () => {
    setSubmissionError(null);

    const leadName = applicants[0]?.fullName?.trim() || "";
    if (leadName.length < 2) {
      setSubmissionError("Full Name is mandatory (as shown on your passport).");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!contactEmail.trim() || !emailRegex.test(contactEmail.trim())) {
      setSubmissionError("A valid Email Address is mandatory.");
      return;
    }

    const phone = contactPhone.trim();
    if (!phone || phone.length < 7) {
      setSubmissionError("A valid WhatsApp / Phone Number is mandatory.");
      return;
    }

    if (!travelDate) {
      setSubmissionError("Date of Travel is mandatory.");
      return;
    }

    if (!travelPurpose) {
      setSubmissionError("Purpose of Visit is mandatory.");
      return;
    }

    for (let i = 0; i < applicants.length; i++) {
      const app = applicants[i];
      if (!app.fullName?.trim() || app.fullName.trim().length < 2) {
        setSubmissionError(`Traveller #${i + 1}: Full Name is mandatory.`);
        setActiveApplicantIndex(i);
        return;
      }
    }

    setCurrentStep(2);
    scrollToSection("apply-flow");
  };

  // Step 2 Validation
  const handleValidateStep2 = () => {
    setSubmissionError(null);

    for (let i = 0; i < applicants.length; i++) {
      const hasPassport = uploadedDocs.some(
        (d) => d.applicantIndex === i && d.documentType === "passport"
      );
      const hasEidFront = uploadedDocs.some(
        (d) => d.applicantIndex === i && d.documentType === "emirates_id_front"
      );
      const hasEidBack = uploadedDocs.some(
        (d) => d.applicantIndex === i && d.documentType === "emirates_id_back"
      );
      const hasPhoto = uploadedDocs.some(
        (d) => d.applicantIndex === i && d.documentType === "photo"
      );

      if (!hasPassport || !hasEidFront || !hasEidBack || !hasPhoto) {
        const missing: string[] = [];
        if (!hasPassport) missing.push("Passport Copy");
        if (!hasEidFront) missing.push("Emirates ID Front");
        if (!hasEidBack) missing.push("Emirates ID Back");
        if (!hasPhoto) missing.push("Passport-size Photo");

        setSubmissionError(
          `Please upload all mandatory documents for ${applicants.length > 1 ? `Traveller #${i + 1}` : "your application"
          }: missing ${missing.join(", ")}.`
        );
        setActiveApplicantIndex(i);
        return;
      }
    }

    setCurrentStep(3);
    scrollToSection("apply-flow");
  };

  // Checkout submission (Step 3)
  const handleSubmitCheckout = () => {
    setSubmissionError(null);

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
          travelPurpose: travelPurpose || "Umrah / Tourism",
          travelDate,
          primaryContact: {
            email: contactEmail.trim(),
            phone: contactPhone.trim(),
          },
          applicants: applicants.map((a) => ({
            fullName: a.fullName.trim(),
            nationality: a.nationality,
            emiratesIdExpiryDate: a.emiratesIdExpiryDate,
            passportNumber: a.passportNumber?.trim() || "SEE_ATTACHED_PASSPORT",
            countryOfResidence: "United Arab Emirates",
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
      <FaqSchema faqs={faqs.map((f) => ({ question: f.q, answer: f.a }))} />
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
                Eligible UAE Residents
              </span>
            </div>

            {/* Intro text */}
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
              Obtain your 1-Year Multiple Entry Saudi Tourist Visa effortlessly. Specially curated for UAE residents holding eligible passports. Fast ~2-3 working days processing with dedicated expert guidance.
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
          4. ABOUT SECTION
      ───────────────────────────────────────────────────────── */}
      <section id="overview" className="scroll-mt-16 py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-deep-gold">
              — ABOUT SAUDI TOURIST VISA —
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-3xl lg:text-4xl">
              About Saudi Tourist Visa
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-masaar-black/75 sm:text-base">
              We help you apply for your 1-Year Multiple Entry Saudi Tourist Visa online with a smooth, reliable and transparent process. Specially designed for eligible UAE residents, ensuring accurate documentation and timely submission to authorities.
            </p>

            {/* 4 Feature Pills Grid */}
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 text-left">
              <div className="flex items-start gap-3 rounded-xl border border-black/5 bg-white p-5 shadow-xs">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                  <FileCheck className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-masaar-black">1 Year Multiple Entry</p>
                  <p className="text-[11px] text-masaar-black/60 mt-0.5">Stay up to 90 days per visit</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-black/5 bg-white p-5 shadow-xs">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                  <Clock className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-masaar-black">Fast processing</p>
                  <p className="text-[11px] text-masaar-black/60 mt-0.5">~2-3 working days turnaround</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-black/5 bg-white p-5 shadow-xs">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                  <ShieldCheck className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-masaar-black">Expert review</p>
                  <p className="text-[11px] text-masaar-black/60 mt-0.5">Documents checked by specialists</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-black/5 bg-white p-5 shadow-xs">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-pure-gold/15 text-deep-gold">
                  <CheckCircle2 className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-masaar-black">Umrah & Tourism</p>
                  <p className="text-[11px] text-masaar-black/60 mt-0.5">Perform Umrah throughout the year</p>
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
              Single Transparent Product
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-masaar-black sm:text-4xl">
              Saudi 1-Year Multiple Entry Tourist Visa
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-xs text-masaar-black/60 sm:text-sm">
              Official Saudi 1-Year Multiple Entry Tourist Visa (AED 750) for eligible UAE residents. Select an individual application or apply together as a family to enjoy 5% savings.
            </p>
          </div>

          <div className="mt-12 mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
            {/* Individual Card */}
            <div
              className={`relative flex flex-col justify-between rounded-xl border bg-white p-7 shadow-sm transition-all hover:shadow-md ${applicationType === "individual"
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
              className={`relative flex flex-col justify-between rounded-xl border bg-white p-7 shadow-sm transition-all hover:shadow-md ${applicationType === "family"
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
                  This service is available for eligible UAE residents (with minimum 3 months UAE residence and 6 months passport validity). Transparent fees are shown before checkout. Other nationalities can contact our concierge team on WhatsApp for manual eligibility verification.
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
                  : "Saudi Tourist Visa Application"}
              </h2>
              <p className="mt-1 text-xs text-masaar-black/60">
                Complete your application details below in 3 easy steps.
              </p>
            </div>

            {/* Step Progress Pills (Exactly 3 steps) */}
            <div className="mb-8 grid grid-cols-3 gap-2 text-center text-xs">
              {[
                { num: 1, label: "Details" },
                { num: 2, label: "Documents" },
                { num: 3, label: "Payment" },
              ].map((s) => (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => s.num < currentStep && setCurrentStep(s.num)}
                  disabled={s.num > currentStep}
                  className={`rounded-xl py-3 px-2 transition-all cursor-pointer ${currentStep === s.num
                      ? "bg-masaar-black text-white font-bold shadow-sm"
                      : currentStep > s.num
                        ? "bg-pure-gold/20 text-deep-gold font-semibold hover:bg-pure-gold/30"
                        : "bg-white text-masaar-black/40 border border-black/5 cursor-not-allowed"
                    }`}
                >
                  <span className="block text-[10px] font-mono uppercase tracking-wider">
                    {currentStep > s.num ? "✓ Completed" : `Step ${s.num}`}
                  </span>
                  <span className="truncate block font-semibold text-xs mt-0.5">{s.label}</span>
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
              {/* STEP 1: FILL IN APPLICATION DETAILS */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-black/5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-masaar-black text-base">
                          Step 1: Fill in Application Details
                        </h3>
                        <p className="text-xs text-masaar-black/60 mt-0.5">
                          Enter passenger and travel information to begin your visa application.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pure-gold bg-pure-gold/10 px-2.5 py-1 rounded-full border border-pure-gold/20">
                        Step 1 of 3
                      </span>
                    </div>
                  </div>

                  {/* Application Type Selector (Individual vs Family) */}
                  <div className="rounded-xl border border-black/10 bg-neutral-50/50 p-4">
                    <label className="block text-xs font-semibold text-masaar-black mb-2">
                      Application Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={handleSelectIndividual}
                        className={`rounded-lg border p-3.5 text-left transition-all cursor-pointer ${applicationType === "individual"
                            ? "border-pure-gold bg-white ring-2 ring-pure-gold/30 shadow-xs"
                            : "border-black/10 bg-white hover:bg-neutral-50"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-masaar-black">Individual</span>
                          {applicationType === "individual" && (
                            <CheckCircle2 className="size-4 text-deep-gold" />
                          )}
                        </div>
                        <p className="text-[11px] text-masaar-black/60 mt-1">
                          1 Traveller • AED 750
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={handleSelectFamily}
                        className={`rounded-lg border p-3.5 text-left transition-all cursor-pointer ${applicationType === "family"
                            ? "border-pure-gold bg-white ring-2 ring-pure-gold/30 shadow-xs"
                            : "border-black/10 bg-white hover:bg-neutral-50"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-masaar-black">Family</span>
                          <span className="text-[10px] font-bold text-deep-gold bg-pure-gold/15 px-1.5 py-0.5 rounded">
                            Save 5%
                          </span>
                        </div>
                        <p className="text-[11px] text-masaar-black/60 mt-1">
                          3+ Travellers • Group discount
                        </p>
                      </button>
                    </div>

                    {/* Family Stepper */}
                    {applicationType === "family" && (
                      <div className="mt-4 pt-4 border-t border-black/5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-masaar-black">
                            Number of Family Members
                          </p>
                          <p className="text-[11px] text-masaar-black/60">
                            Minimum 3 travellers to qualify for the 5% family discount.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleUpdateFamilyCount(Math.max(3, applicantCount - 1))}
                            disabled={applicantCount <= 3}
                            className="size-8 rounded-md border border-black/20 flex items-center justify-center text-masaar-black hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-masaar-black">
                            {applicantCount}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateFamilyCount(Math.min(10, applicantCount + 1))}
                            disabled={applicantCount >= 10}
                            className="size-8 rounded-md border border-black/20 flex items-center justify-center text-masaar-black hover:bg-black/5 disabled:opacity-30 cursor-pointer"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Family Applicant Tabs */}
                  {applicationType === "family" && applicants.length > 1 && (
                    <div className="flex flex-wrap gap-2 border-b border-black/10 pb-3">
                      {applicants.map((app, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveApplicantIndex(idx)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${activeApplicantIndex === idx
                              ? "bg-masaar-black text-white shadow-xs"
                              : "bg-neutral-100 text-masaar-black/70 hover:bg-neutral-200"
                            }`}
                        >
                          {idx === 0 ? "Traveller 1 (Lead)" : `Traveller ${idx + 1}`}
                          {app.fullName.trim() && (
                            <span className="ml-1.5 text-[10px] opacity-75">
                              • {app.fullName.trim().split(" ")[0]}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Form Fields for Active Applicant */}
                  <div className="space-y-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black mb-1.5">
                        Full Name * (As printed on passport)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Mohammed Ahmed"
                        value={applicants[activeApplicantIndex]?.fullName || ""}
                        onChange={(e) =>
                          handleApplicantChange(activeApplicantIndex, "fullName", e.target.value)
                        }
                        className="w-full rounded-md border border-black/20 px-3.5 py-2.5 text-xs text-masaar-black focus:border-pure-gold focus:outline-hidden focus:ring-1 focus:ring-pure-gold"
                      />
                    </div>

                    {/* Contact Details (Lead Traveller only) */}
                    {activeApplicantIndex === 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-masaar-black mb-1.5">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="name@example.com"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full rounded-md border border-black/20 px-3.5 py-2.5 text-xs text-masaar-black focus:border-pure-gold focus:outline-hidden focus:ring-1 focus:ring-pure-gold"
                          />
                          <p className="text-[10px] text-masaar-black/50 mt-1">
                            Visa updates and payment receipt will be sent here.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-masaar-black mb-1.5">
                            Phone Number * (UAE / WhatsApp)
                          </label>
                          <input
                            type="tel"
                            required
                            placeholder="+971 50 123 4567"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            className="w-full rounded-md border border-black/20 px-3.5 py-2.5 text-xs text-masaar-black focus:border-pure-gold focus:outline-hidden focus:ring-1 focus:ring-pure-gold"
                          />
                          <p className="text-[10px] text-masaar-black/50 mt-1">
                            Used for urgent status notifications and concierge delivery.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Date of Travel */}
                    {activeApplicantIndex === 0 && (
                      <div>
                        <label className="block text-xs font-semibold text-masaar-black mb-1.5">
                          Date of Travel *
                        </label>
                        <input
                          type="date"
                          required
                          min={new Date().toISOString().split("T")[0]}
                          value={travelDate}
                          onChange={(e) => setTravelDate(e.target.value)}
                          className="w-full rounded-md border border-black/20 px-3.5 py-2.5 text-xs text-masaar-black focus:border-pure-gold focus:outline-hidden focus:ring-1 focus:ring-pure-gold"
                        />
                        <p className="text-[10px] text-masaar-black/50 mt-1">
                          Estimated date of arrival in the Kingdom of Saudi Arabia.
                        </p>
                      </div>
                    )}

                    {/* Purpose of Visit */}
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black mb-1.5">
                        Purpose of Visit *
                      </label>
                      <select
                        value={travelPurpose}
                        onChange={(e) => setTravelPurpose(e.target.value)}
                        className="w-full rounded-md border border-black/20 px-3.5 py-2.5 text-xs text-masaar-black focus:border-pure-gold focus:outline-hidden focus:ring-1 focus:ring-pure-gold bg-white"
                      >
                        <option value="Tourism / Leisure">Tourism / Leisure</option>
                        <option value="Umrah">Umrah (Outside restricted Hajj period)</option>
                        <option value="Visiting Family / Relatives">Visiting Family / Relatives</option>
                        <option value="Business / Events">Business / Events / Conferences</option>
                        <option value="Transit">Transit / Short Layover</option>
                      </select>
                      <p className="text-[10px] text-masaar-black/50 mt-1">
                        All passport and UAE residency information will be verified directly from your uploaded documents in Step 2.
                      </p>
                    </div>
                  </div>

                  {/* Step 1 Actions */}
                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleValidateStep1}
                      className="inline-flex items-center gap-2 rounded-md bg-masaar-black px-8 py-3.5 text-xs font-semibold text-white shadow-md hover:bg-black/90 active:scale-95 cursor-pointer"
                    >
                      Continue to Upload Documents →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: UPLOAD DOCUMENTS */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-black/5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-masaar-black text-base">
                          Step 2: Upload Required Documents
                        </h3>
                        <p className="text-xs text-masaar-black/60 mt-0.5">
                          Please provide clear color scans or photos. Stored encrypted in private storage.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pure-gold bg-pure-gold/10 px-2.5 py-1 rounded-full border border-pure-gold/20">
                        Step 2 of 3
                      </span>
                    </div>
                  </div>

                  {/* Family Applicant Tabs if Multiple */}
                  {applicationType === "family" && applicants.length > 1 && (
                    <div className="flex flex-wrap gap-2 border-b border-black/10 pb-3">
                      {applicants.map((app, idx) => {
                        const appDocs = uploadedDocs.filter((d) => d.applicantIndex === idx);
                        const mandatoryCount = [
                          "passport",
                          "emirates_id_front",
                          "emirates_id_back",
                          "photo",
                        ].filter((t) => appDocs.some((d) => d.documentType === t)).length;

                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveApplicantIndex(idx)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${activeApplicantIndex === idx
                                ? "bg-masaar-black text-white shadow-xs"
                                : "bg-neutral-100 text-masaar-black/70 hover:bg-neutral-200"
                              }`}
                          >
                            <span>
                              {idx === 0 ? "Traveller 1 (Lead)" : `Traveller ${idx + 1}`}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-full ${mandatoryCount === 4
                                  ? "bg-emerald-500/20 text-emerald-700"
                                  : "bg-amber-500/20 text-amber-800"
                                }`}
                            >
                              {mandatoryCount}/4
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Upload Info Banner */}
                  <div className="rounded-xl border border-black/10 bg-warm-ivory/60 p-3.5 flex items-start gap-3">
                    <ShieldCheck className="size-5 shrink-0 text-deep-gold mt-0.5" />
                    <div className="text-xs text-masaar-black/80 leading-relaxed">
                      <p className="font-semibold text-masaar-black">
                        Accepted File Formats & Size Limits
                      </p>
                      <p className="mt-0.5 text-masaar-black/60">
                        JPG, PNG, WEBP, or PDF up to 10 MB per file. Documents are stored in secure private storage and accessed only by licensed visa processing officers.
                      </p>
                    </div>
                  </div>

                  {/* Document Upload Slots */}
                  <div className="space-y-4">
                    {DOCUMENT_SLOTS.map((slot) => {
                      const slotKey = `${activeApplicantIndex}_${slot.type}`;
                      const isUploading = uploadingSlots[slotKey] || false;
                      const uploaded = uploadedDocs.find(
                        (d) =>
                          d.applicantIndex === activeApplicantIndex &&
                          d.documentType === slot.type
                      );

                      return (
                        <div
                          key={slot.type}
                          className={`rounded-xl border p-4 transition-all ${uploaded
                              ? "border-emerald-200 bg-emerald-50/30"
                              : slot.mandatory
                                ? "border-black/15 bg-white"
                                : "border-black/10 bg-neutral-50/50"
                            }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-masaar-black">
                                  {slot.title}
                                </h4>
                                {slot.mandatory ? (
                                  <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                                    Mandatory *
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium text-masaar-black/50 bg-black/5 px-2 py-0.5 rounded">
                                    Optional
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-masaar-black/60 mt-1">
                                {slot.description}
                              </p>
                            </div>

                            {/* Slot Status / Controls */}
                            <div className="flex items-center gap-2 shrink-0">
                              {isUploading ? (
                                <div className="flex items-center gap-2 text-xs text-deep-gold font-medium">
                                  <div className="size-4 animate-spin rounded-full border-2 border-pure-gold border-t-transparent" />
                                  <span>Uploading...</span>
                                </div>
                              ) : uploaded ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-md">
                                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                                    <span className="font-semibold truncate max-w-[140px]">
                                      {uploaded.fileName}
                                    </span>
                                    <span className="text-[10px] opacity-70">
                                      ({(uploaded.fileSize / 1024).toFixed(0)} KB)
                                    </span>
                                  </div>

                                  {/* Replace Button */}
                                  <label className="rounded-md border border-black/20 bg-white px-3 py-1 text-[11px] font-semibold text-masaar-black hover:bg-neutral-50 cursor-pointer">
                                    Replace
                                    <input
                                      type="file"
                                      accept={slot.accept}
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          handleFileUpload(
                                            activeApplicantIndex,
                                            slot.type,
                                            file
                                          );
                                        }
                                      }}
                                    />
                                  </label>

                                  {/* Optional Remove Button */}
                                  {!slot.mandatory && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveDoc(activeApplicantIndex, slot.type)
                                      }
                                      className="text-masaar-black/40 hover:text-rose-600 p-1 cursor-pointer"
                                      title="Remove document"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <label className="inline-flex items-center gap-1.5 rounded-md bg-pure-gold px-4 py-2 text-xs font-semibold text-masaar-black shadow-xs hover:bg-light-gold cursor-pointer transition-all">
                                  <Upload className="size-3.5" />
                                  <span>Upload File</span>
                                  <input
                                    type="file"
                                    accept={slot.accept}
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        handleFileUpload(
                                          activeApplicantIndex,
                                          slot.type,
                                          file
                                        );
                                      }
                                    }}
                                  />
                                </label>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Step 2 Actions */}
                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(1);
                        scrollToSection("apply-flow");
                      }}
                      className="rounded-md border border-black/20 px-5 py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/5 cursor-pointer"
                    >
                      ← Back to Details
                    </button>
                    <button
                      type="button"
                      onClick={handleValidateStep2}
                      className="inline-flex items-center gap-2 rounded-md bg-masaar-black px-8 py-3.5 text-xs font-semibold text-white shadow-md hover:bg-black/90 active:scale-95 cursor-pointer"
                    >
                      Continue to Payment →
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: REVIEW & PAYMENT */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-black/5 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-masaar-black text-base">
                          Step 3: Review & Secure Payment
                        </h3>
                        <p className="text-xs text-masaar-black/60 mt-0.5">
                          Review your application summary and proceed with live payment.
                        </p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-pure-gold bg-pure-gold/10 px-2.5 py-1 rounded-full border border-pure-gold/20">
                        Step 3 of 3
                      </span>
                    </div>
                  </div>

                  {/* Application Summary Box */}
                  <div className="rounded-xl border border-black/10 bg-warm-ivory/40 p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-black/5 pb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-deep-gold font-semibold">
                          Selected Product
                        </span>
                        <h4 className="text-sm font-bold text-masaar-black">
                          Saudi 1-Year Multiple Entry Tourist Visa
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-masaar-black">
                          {applicationType === "family"
                            ? `Family (${applicantCount} Travellers)`
                            : "Individual (1 Traveller)"}
                        </span>
                      </div>
                    </div>

                    {/* Contact & Travel Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="block text-[10px] text-masaar-black/50 uppercase font-semibold">
                          Contact Email
                        </span>
                        <span className="font-medium text-masaar-black">{contactEmail}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-masaar-black/50 uppercase font-semibold">
                          Phone Number
                        </span>
                        <span className="font-medium text-masaar-black">{contactPhone}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-masaar-black/50 uppercase font-semibold">
                          Travel Date
                        </span>
                        <span className="font-medium text-masaar-black">{travelDate}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-masaar-black/50 uppercase font-semibold">
                          Purpose of Visit
                        </span>
                        <span className="font-medium text-masaar-black">{travelPurpose}</span>
                      </div>
                    </div>

                    {/* Applicant Breakdown */}
                    <div className="border-t border-black/5 pt-3 space-y-2">
                      <span className="block text-[10px] text-masaar-black/50 uppercase font-semibold">
                        Applicants & Document Status
                      </span>
                      {applicants.map((app, idx) => {
                        const appDocs = uploadedDocs.filter((d) => d.applicantIndex === idx);
                        const hasPassport = appDocs.some((d) => d.documentType === "passport");
                        const hasEidFront = appDocs.some((d) => d.documentType === "emirates_id_front");
                        const hasEidBack = appDocs.some((d) => d.documentType === "emirates_id_back");
                        const hasPhoto = appDocs.some((d) => d.documentType === "photo");
                        const allMandatory = hasPassport && hasEidFront && hasEidBack && hasPhoto;

                        return (
                          <div
                            key={idx}
                            className="rounded-lg border border-black/5 bg-white p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                          >
                            <div>
                              <span className="font-bold text-masaar-black">
                                {idx + 1}. {app.fullName}
                              </span>
                              <span className="text-masaar-black/50 text-[11px] block sm:inline sm:ml-2">
                                (Passport & Emirates ID attached)
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {allMandatory ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                  <CheckCircle2 className="size-3 text-emerald-600" />
                                  All 4 Mandatory Docs Uploaded
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                                  <AlertCircle className="size-3 text-rose-600" />
                                  Missing Mandatory Docs
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="rounded-xl border border-black/10 bg-white p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black">
                      Price Breakdown
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-masaar-black/70">
                        <span>
                          Standard Visa Fee (AED 750 × {pricing.applicantCount}{" "}
                          {pricing.applicantCount > 1 ? "travellers" : "traveller"})
                        </span>
                        <span className="font-medium text-masaar-black">
                          AED {pricing.subtotal.toFixed(2)}
                        </span>
                      </div>

                      {pricing.familyDiscountAmount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-semibold">
                          <span>Family Bundle Discount (5%)</span>
                          <span>- AED {pricing.familyDiscountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      <div className="border-t border-black/10 pt-3 flex justify-between items-baseline">
                        <div>
                          <span className="text-sm font-bold text-masaar-black">
                            Total Payable Amount
                          </span>
                          <span className="block text-[11px] text-masaar-black/50">
                            Includes 1-Year Multiple Entry Visa, mandatory insurance & government fees.
                          </span>
                        </div>
                        <span className="text-xl font-bold text-masaar-black font-[family-name:var(--font-display)]">
                          AED {pricing.finalPayableAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Gateway Selector */}
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-masaar-black">
                      Select Payment Method
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Stripe Live */}
                      <button
                        type="button"
                        onClick={() => setPaymentGateway("stripe")}
                        className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${paymentGateway === "stripe"
                            ? "border-pure-gold bg-pure-gold/5 ring-2 ring-pure-gold/30"
                            : "border-black/10 bg-white hover:bg-neutral-50"
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-masaar-black">
                            Credit / Debit Card / Apple Pay
                          </span>
                          {paymentGateway === "stripe" && (
                            <CheckCircle2 className="size-4 text-deep-gold" />
                          )}
                        </div>
                        <p className="text-[11px] text-masaar-black/60 mt-1">
                          Visa, Mastercard, American Express, Apple Pay & Google Pay.
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
                          <Lock className="size-3" />
                          <span>256-bit SSL Encrypted • Processed by Stripe</span>
                        </div>
                      </button>

                      {/* Tabby (If available) */}
                      {isTabbyAvailable && (
                        <button
                          type="button"
                          onClick={() => setPaymentGateway("tabby")}
                          className={`rounded-xl border p-4 text-left transition-all cursor-pointer ${paymentGateway === "tabby"
                              ? "border-pure-gold bg-pure-gold/5 ring-2 ring-pure-gold/30"
                              : "border-black/10 bg-white hover:bg-neutral-50"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-masaar-black">
                              Tabby — 4 Interest-Free Payments
                            </span>
                            {paymentGateway === "tabby" && (
                              <CheckCircle2 className="size-4 text-deep-gold" />
                            )}
                          </div>
                          <p className="text-[11px] text-masaar-black/60 mt-1">
                            Pay AED {(pricing.finalPayableAmount / 4).toFixed(2)} today, rest over 3 months. No interest.
                          </p>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Terms Acceptance Checkbox */}
                  <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-neutral-50/50 p-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 size-4 rounded border-black/20 text-deep-gold focus:ring-pure-gold cursor-pointer"
                    />
                    <span className="text-xs text-masaar-black/80 leading-relaxed">
                      I confirm that all entered details and uploaded documents are genuine and accurate. I understand that visa issuance is subject to Saudi government regulations and I accept Masaar Holidays&apos;{" "}
                      <Link href="/terms" target="_blank" className="font-semibold text-masaar-black underline">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/refund-policy" target="_blank" className="font-semibold text-masaar-black underline">
                        Refund Policy
                      </Link>
                      .
                    </span>
                  </label>

                  {/* Step 3 Actions */}
                  <div className="pt-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(2);
                        scrollToSection("apply-flow");
                      }}
                      className="rounded-md border border-black/20 px-5 py-2.5 text-xs font-semibold text-masaar-black hover:bg-black/5 cursor-pointer"
                    >
                      ← Back to Documents
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || !termsAccepted}
                      onClick={handleSubmitCheckout}
                      className="inline-flex items-center gap-2 rounded-md bg-pure-gold px-8 py-3.5 text-xs font-semibold text-masaar-black shadow-lg hover:bg-light-gold disabled:opacity-50 cursor-pointer transition-all active:scale-95"
                    >
                      <Lock className="size-4" />
                      {isSubmitting
                        ? "Initiating Secure Checkout..."
                        : `Proceed to Pay AED ${pricing.finalPayableAmount.toFixed(2)} →`}
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
                    href={`tel:${CONTACT.landlineTel}`}
                    className="inline-flex items-center gap-2 rounded-md border border-black/15 bg-white px-5 py-3.5 text-xs font-semibold text-masaar-black transition-all hover:bg-black/5"
                  >
                    Landline {CONTACT.landlineDisplay}
                  </a>
                  <a
                    href={`tel:+${CONTACT.whatsappPhoneIntl}`}
                    className="inline-flex items-center gap-2 rounded-md border border-black/15 bg-white px-5 py-3.5 text-xs font-semibold text-masaar-black transition-all hover:bg-black/5"
                  >
                    Mobile {CONTACT.phoneDisplay}
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
