"use client";

import React, { useState, useTransition, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  Clock,
  FileCheck,
  ShieldCheck,
  Check,
  Users,
  User,
  Plus,
  Minus,
  Upload,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  ArrowRight,
  MessageCircle,
  FileText,
  CreditCard,
  CheckCircle2,
  Trash2,
  Info,
} from "./saudi-visa-icons";
import {
  DEFAULT_SAUDI_VISA_SETTINGS,
  calculateSaudiVisaPricing,
  isNationalityApproved,
  getSaudiVisaWhatsAppLink,
  SAUDI_VISA_FAQS,
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
};

export function SaudiVisaLandingPage() {
  const [applicationType, setApplicationType] = useState<"individual" | "family">("individual");
  const [applicantCount, setApplicantCount] = useState<number>(1);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

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
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isSubmitting, startSubmission] = useTransition();

  // Active applicant tab in Step 3
  const [activeApplicantIndex, setActiveApplicantIndex] = useState<number>(0);

  // Pricing calculation
  const effectiveCount = applicationType === "individual" ? 1 : Math.max(3, applicantCount);
  const pricing: PricingBreakdown = calculateSaudiVisaPricing(effectiveCount, applicationType);

  // Handlers for switching application type
  const handleSelectIndividual = () => {
    setApplicationType("individual");
    setApplicantCount(1);
    setApplicants((prev) => [prev[0] || { ...EMPTY_APPLICANT, nationality: eligibilityNationality }]);
    trackMetaPixel("ApplicationStarted", { application_type: "individual", applicant_count: 1 });
    scrollToSection("apply-flow");
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
    scrollToSection("apply-flow");
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

    // Validation
    if (!contactEmail || !contactPhone) {
      setSubmissionError("Please provide your contact email and UAE phone number in Step 3.");
      setCurrentStep(3);
      return;
    }

    for (let i = 0; i < applicants.length; i++) {
      const app = applicants[i];
      if (!app.fullName.trim() || app.fullName.trim().length < 2) {
        setSubmissionError(`Applicant #${i + 1}: Please enter the full legal name shown on the passport.`);
        setActiveApplicantIndex(i);
        setCurrentStep(3);
        return;
      }
      if (!app.passportNumber.trim()) {
        setSubmissionError(`Applicant #${i + 1}: Please enter the passport number.`);
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

  return (
    <div className="min-h-screen bg-warm-ivory text-masaar-black font-sans selection:bg-gold/20">
      {/* ─────────────────────────────────────────────────────────
          DEDICATED LANDING PAGE HEADER
      ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-masaar-black/95 backdrop-blur-md border-b border-gold/25 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/brand/masaar-logo.png"
              alt="Masaar Holidays Logo"
              width={170}
              height={46}
              className="h-10 w-auto object-contain transition-transform group-hover:scale-[1.02]"
              priority
            />
          </Link>

          {/* Minimal Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wider uppercase">
            <Link href="/" className="text-white/70 hover:text-gold transition-colors">
              Home
            </Link>
            <Link href="/umrah" className="text-white/70 hover:text-gold transition-colors">
              Umrah
            </Link>
            <Link href="/hajj" className="text-white/70 hover:text-gold transition-colors">
              Hajj
            </Link>
            <Link href="/hotels" className="text-white/70 hover:text-gold transition-colors">
              Hotels
            </Link>
            <span className="text-gold border-b-2 border-gold pb-1 font-bold">
              Saudi Visa
            </span>
            <Link href="/contact" className="text-white/70 hover:text-gold transition-colors">
              Contact
            </Link>
          </nav>

          {/* Header WhatsApp Button */}
          <a
            href={heroWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#C9A227] hover:bg-[#b08d20] text-masaar-black text-xs font-bold px-4 py-2.5 rounded-lg transition-all shadow-md hover:shadow-gold/20"
          >
            <MessageCircle className="w-4 h-4 fill-masaar-black" />
            <span>Enquire on WhatsApp</span>
          </a>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────
          SECTION 1 — HERO
      ───────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0A0A08] via-[#141410] to-[#1E1E18] text-white pt-10 pb-16 lg:py-20 border-b border-gold/20">
        {/* Subtle Path motif background accent */}
        <div className="absolute inset-0 pointer-events-none opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1440 800" fill="none">
            <path
              d="M-100 400 C 300 200, 800 600, 1540 300"
              stroke="#C9A227"
              strokeWidth="2"
              strokeDasharray="8 8"
            />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-6">
              {/* Tag */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-gold">
                  Saudi Tourist Visa
                </span>
                <div className="h-[1px] w-16 bg-gold/50" />
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white font-sans leading-[1.15]">
                Your Journey to <br className="hidden sm:inline" />
                <span className="text-gold font-serif italic">Makkah</span> Starts Here.
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-white/80 max-w-xl font-normal leading-relaxed">
                Discover Saudi Arabia and plan your eligible Umrah journey with a{" "}
                <strong className="text-white font-semibold">1-Year Multiple-Entry Saudi Tourist Visa</strong>.
              </p>

              {/* Price & Features Badge Box */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <div className="bg-[#EBDFA8]/20 border border-gold/40 rounded-xl px-5 py-3 flex items-center gap-3 backdrop-blur-sm">
                  <span className="text-xs font-semibold text-gold tracking-wide uppercase">AED</span>
                  <span className="text-3xl font-extrabold text-white">750</span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gold/15 flex items-center justify-center text-gold">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">1-Year Multiple-Entry Visa</span>
                    <span className="text-[11px] text-white/60">Fast ~2 working days processing</span>
                  </div>
                </div>
              </div>

              {/* Dual CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => scrollToSection("choose-application")}
                  className="inline-flex items-center justify-center gap-2 bg-[#C9A227] hover:bg-[#b58f1e] text-masaar-black font-bold text-sm uppercase tracking-wider px-7 py-4 rounded-xl transition-all shadow-lg shadow-gold/25 hover:shadow-gold/40 group"
                >
                  <span>Apply for Your Visa</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <a
                  href={heroWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-white/10 text-white border border-white/25 font-semibold text-sm px-6 py-4 rounded-xl transition-all"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Enquire on WhatsApp</span>
                </a>
              </div>

              {/* Eligibility & Disclaimer Note */}
              <p className="text-xs text-white/60 leading-relaxed max-w-xl pt-2">
                For eligible UAE residents holding approved passport nationalities. Visa issuance is subject to Saudi authorities and applicable regulations.
              </p>
            </div>

            {/* Right Kaaba Photograph Arch Column */}
            <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md aspect-[4/5] rounded-t-[140px] rounded-b-2xl overflow-hidden border-2 border-gold/40 shadow-2xl shadow-gold/10">
                <Image
                  src="/brand/saudi-visa-kaaba-hero.jpg"
                  alt="Holy Kaaba at Masjid al-Haram, Makkah"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 450px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-masaar-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-center">
                  <span className="text-[11px] font-medium tracking-widest uppercase text-gold/90 bg-masaar-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-gold/30">
                    Masjid al-Haram · Makkah
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 2 — VISA BENEFITS (4 ELEGANT CARDS)
      ───────────────────────────────────────────────────────── */}
      <section className="py-12 bg-white border-b border-masaar-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Benefit 1 */}
            <div className="bg-warm-ivory/40 hover:bg-warm-ivory/70 border border-gold/25 rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center text-gold mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-masaar-black mb-1.5 font-sans">
                1-Year Multiple Entry
              </h3>
              <p className="text-xs text-masaar-black/70 leading-relaxed">
                Apply for a multiple-entry tourist visa with validity subject to official visa conditions.
              </p>
            </div>

            {/* Benefit 2 */}
            <div className="bg-warm-ivory/40 hover:bg-warm-ivory/70 border border-gold/25 rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center text-gold mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-masaar-black mb-1.5 font-sans">
                ≈ 2 Working Days
              </h3>
              <p className="text-xs text-masaar-black/70 leading-relaxed">
                Estimated processing time after complete documents, payment and verification.
              </p>
            </div>

            {/* Benefit 3 */}
            <div className="bg-warm-ivory/40 hover:bg-warm-ivory/70 border border-gold/25 rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center text-gold mb-4">
                <FileCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-masaar-black mb-1.5 font-sans">
                Simple Documentation
              </h3>
              <p className="text-xs text-masaar-black/70 leading-relaxed">
                A straightforward application process with three initial document requirements.
              </p>
            </div>

            {/* Benefit 4 */}
            <div className="bg-warm-ivory/40 hover:bg-warm-ivory/70 border border-gold/25 rounded-2xl p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
              <div className="w-12 h-12 rounded-xl bg-gold/15 flex items-center justify-center text-gold mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-masaar-black mb-1.5 font-sans">
                Refund Assurance
              </h3>
              <p className="text-xs text-masaar-black/70 leading-relaxed">
                Masaar's stated refund policy if the application is rejected, subject to published terms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 3 — CHOOSE YOUR APPLICATION
      ───────────────────────────────────────────────────────── */}
      <section id="choose-application" className="py-16 sm:py-20 bg-warm-ivory relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-masaar-black font-sans tracking-tight">
              Choose the Right Application for Your Journey.
            </h2>
            <div className="w-20 h-1 bg-gold mx-auto mt-4 rounded-full" />
            <p className="text-sm text-masaar-black/70 mt-4">
              Apply individually or save with our family application discount for 3 or more travellers.
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* OPTION A: INDIVIDUAL APPLICATION */}
            <div
              className={`bg-white rounded-3xl p-8 border-2 transition-all flex flex-col justify-between shadow-lg ${
                applicationType === "individual"
                  ? "border-masaar-black ring-4 ring-gold/20"
                  : "border-masaar-black/10 hover:border-gold/50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-warm-ivory flex items-center justify-center text-gold border border-gold/30">
                    <User className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-masaar-black/60 bg-warm-ivory px-3 py-1 rounded-full">
                    Solo Traveller
                  </span>
                </div>

                <h3 className="text-xl font-bold text-masaar-black">Individual Saudi Visa</h3>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-masaar-black/60">AED</span>
                  <span className="text-3xl font-extrabold text-masaar-black">750</span>
                  <span className="text-xs text-masaar-black/60">/ applicant</span>
                </div>
                <p className="text-xs text-masaar-black/70 mt-1">For one eligible applicant.</p>

                <div className="h-[1px] bg-masaar-black/10 my-6" />

                <ul className="space-y-3 text-xs text-masaar-black/80">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span>One applicant</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span>1-Year Multiple-Entry Saudi Tourist Visa</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span>≈ 2 working days estimated processing</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span>Three initial documents</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span>Refund assurance subject to terms</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8 space-y-3">
                <button
                  type="button"
                  onClick={handleSelectIndividual}
                  className="w-full bg-masaar-black hover:bg-masaar-black/90 text-white font-bold text-xs uppercase tracking-wider py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md group"
                >
                  <span>Apply Individually</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href={heroWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center text-xs font-semibold text-masaar-black/70 hover:text-gold transition-colors py-1"
                >
                  Enquire via WhatsApp instead
                </a>
              </div>
            </div>

            {/* OPTION B: FAMILY APPLICATION (5% OFF) */}
            <div
              className={`bg-white rounded-3xl p-8 border-2 relative transition-all flex flex-col justify-between shadow-xl ${
                applicationType === "family"
                  ? "border-gold ring-4 ring-gold/25"
                  : "border-gold/40 hover:border-gold"
              }`}
            >
              {/* Discount Ribbon Badge */}
              <div className="absolute -top-3.5 right-6 bg-[#C9A227] text-masaar-black text-xs font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-md">
                5% OFF
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#C9A227]/15 flex items-center justify-center text-gold border border-gold/40">
                    <Users className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-gold bg-gold/10 px-3 py-1 rounded-full">
                    Family Group Offer
                  </span>
                </div>

                <h3 className="text-xl font-bold text-masaar-black">Family Visa Application</h3>
                <p className="text-xs text-masaar-black/70 mt-1">
                  Apply together and enjoy a family application discount.
                </p>

                <div className="h-[1px] bg-masaar-black/10 my-6" />

                <ul className="space-y-3 text-xs text-masaar-black/80 mb-6">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span>Minimum 3 applicants in one application</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span>5% discount applied per applicant</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span>All applicants included in the same application</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <span>Each applicant independently meets eligibility</span>
                  </li>
                </ul>

                {/* Price Example Box */}
                <div className="bg-warm-ivory/60 border border-gold/30 rounded-2xl p-4 text-xs space-y-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-masaar-black/80 block">
                    Price Example
                  </span>
                  <div className="flex justify-between items-center text-masaar-black/80">
                    <span>3 Applicants:</span>
                    <span className="line-through text-masaar-black/50">AED 2,250</span>
                    <span className="font-bold text-gold">AED 2,137.50 (5% OFF)</span>
                  </div>
                  <div className="flex justify-between items-center text-masaar-black/80">
                    <span>4 Applicants:</span>
                    <span className="line-through text-masaar-black/50">AED 3,000</span>
                    <span className="font-bold text-gold">AED 2,850.00 (5% OFF)</span>
                  </div>
                </div>
              </div>

              <div className="pt-8 space-y-3">
                <button
                  type="button"
                  onClick={handleSelectFamily}
                  className="w-full bg-[#C9A227] hover:bg-[#b58f1e] text-masaar-black font-bold text-xs uppercase tracking-wider py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md group"
                >
                  <span>Apply as a Family</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href={familyWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block text-center text-xs font-semibold text-masaar-black/70 hover:text-gold transition-colors py-1"
                >
                  Enquire about family discount on WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 4 — A SIMPLE APPLICATION PROCESS (6-STEP TIMELINE)
      ───────────────────────────────────────────────────────── */}
      <section className="py-14 bg-white border-y border-masaar-black/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-masaar-black font-sans">
              A Simple Application Process
            </h2>
            <div className="w-16 h-1 bg-gold mx-auto mt-3 rounded-full" />
          </div>

          {/* 6 Step Circles */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative">
            {[
              { num: 1, title: "1. Check Eligibility", icon: CheckCircle2 },
              { num: 2, title: "2. Choose Application Type", icon: Users },
              { num: 3, title: "3. Enter Applicant Details", icon: User },
              { num: 4, title: "4. Upload Documents", icon: Upload },
              { num: 5, title: "5. Make Payment", icon: CreditCard },
              { num: 6, title: "6. Get Confirmation", icon: Check },
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={step.num} className="flex flex-col items-center text-center group">
                  <div className="w-14 h-14 rounded-full bg-warm-ivory border-2 border-gold/40 flex items-center justify-center text-gold mb-3 transition-transform group-hover:scale-105 shadow-sm">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold text-masaar-black leading-tight max-w-[120px]">
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 5 — NEED ASSISTANCE BANNER
      ───────────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="relative rounded-3xl overflow-hidden border border-gold/30 shadow-xl bg-masaar-black text-white">
          <Image
            src="/brand/saudi-visa-madinah-banner.jpg"
            alt="Prophet's Mosque in Madinah"
            fill
            className="object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-masaar-black/90 via-masaar-black/75 to-transparent" />

          <div className="relative z-10 p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-left">
              <h3 className="text-2xl sm:text-3xl font-extrabold font-sans text-white">
                Need Assistance?
              </h3>
              <p className="text-xs sm:text-sm text-warm-ivory/80 max-w-lg">
                Speak directly with Masaar's visa team for eligibility, documents or application support.
              </p>
            </div>

            <a
              href={heroWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 bg-white text-masaar-black hover:bg-gold transition-all font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl shadow-lg flex-shrink-0"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              <span>Enquire on WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 6 — SHARED MULTI-STEP VISA APPLICATION SYSTEM
      ───────────────────────────────────────────────────────── */}
      <section id="apply-flow" className="py-16 bg-white border-t border-masaar-black/10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-gold block">
              Application Portal
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-masaar-black font-sans mt-1">
              {applicationType === "family" ? "Family Visa Application" : "Individual Visa Application"}
            </h2>
            <p className="text-xs text-masaar-black/60 mt-1">
              Complete your application in 6 structured steps with secure verification.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2">
            {[
              { step: 1, label: "Type" },
              { step: 2, label: "Eligibility" },
              { step: 3, label: "Details" },
              { step: 4, label: "Documents" },
              { step: 5, label: "Pricing" },
              { step: 6, label: "Payment" },
            ].map((s) => (
              <button
                key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step)}
                className="flex items-center gap-2 group flex-shrink-0"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    currentStep === s.step
                      ? "bg-masaar-black text-gold ring-2 ring-gold"
                      : currentStep > s.step
                      ? "bg-gold text-masaar-black"
                      : "bg-warm-ivory text-masaar-black/50 border border-masaar-black/15"
                  }`}
                >
                  {currentStep > s.step ? <Check className="w-4 h-4" /> : s.step}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:inline ${
                    currentStep === s.step ? "text-masaar-black font-bold" : "text-masaar-black/50"
                  }`}
                >
                  {s.label}
                </span>
              </button>
            ))}
          </div>

          {/* Error Banner */}
          {submissionError && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <div>
                <strong className="font-bold block">Please review the following:</strong>
                <p>{submissionError}</p>
              </div>
            </div>
          )}

          {/* Step Container Box */}
          <div className="bg-warm-ivory/30 border border-masaar-black/10 rounded-3xl p-6 sm:p-10 shadow-sm">
            {/* ── STEP 1: APPLICATION TYPE ── */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-masaar-black flex items-center gap-2">
                  <Users className="w-5 h-5 text-gold" />
                  Step 1: Select Your Application Type
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Individual Option */}
                  <div
                    onClick={() => {
                      setApplicationType("individual");
                      setApplicantCount(1);
                      setApplicants((prev) => [prev[0] || { ...EMPTY_APPLICANT, nationality: eligibilityNationality }]);
                    }}
                    className={`cursor-pointer p-5 rounded-2xl border-2 transition-all ${
                      applicationType === "individual"
                        ? "border-masaar-black bg-white shadow-md ring-2 ring-gold/30"
                        : "border-masaar-black/10 bg-white/60 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-masaar-black">Individual Application</span>
                      <span className="text-xs font-bold text-gold">AED 750</span>
                    </div>
                    <p className="text-xs text-masaar-black/60">
                      Standard application for 1 traveller.
                    </p>
                  </div>

                  {/* Family Option */}
                  <div
                    onClick={() => {
                      setApplicationType("family");
                      if (applicantCount < 3) {
                        handleUpdateFamilyCount(3);
                      }
                    }}
                    className={`cursor-pointer p-5 rounded-2xl border-2 relative transition-all ${
                      applicationType === "family"
                        ? "border-gold bg-white shadow-md ring-2 ring-gold/30"
                        : "border-masaar-black/10 bg-white/60 hover:bg-white"
                    }`}
                  >
                    <div className="absolute -top-2.5 right-4 bg-gold text-masaar-black text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                      5% OFF
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-masaar-black">Family Application</span>
                      <span className="text-xs font-bold text-gold">5% Discount</span>
                    </div>
                    <p className="text-xs text-masaar-black/60">
                      Minimum 3 applicants required to unlock discount.
                    </p>
                  </div>
                </div>

                {/* Family Counter Controls */}
                {applicationType === "family" && (
                  <div className="bg-white p-5 rounded-2xl border border-gold/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-xs uppercase text-masaar-black block">
                          Number of Family Applicants
                        </span>
                        <span className="text-[11px] text-masaar-black/60">
                          Minimum 3 applicants in one application
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleUpdateFamilyCount(applicantCount - 1)}
                          disabled={applicantCount <= 3}
                          className="w-9 h-9 rounded-xl border border-masaar-black/20 flex items-center justify-center text-masaar-black disabled:opacity-30 disabled:cursor-not-allowed hover:bg-warm-ivory"
                        >
                          <Minus className="w-4 h-4" />
                        </button>

                        <span className="text-lg font-bold text-masaar-black w-6 text-center">
                          {applicantCount}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleUpdateFamilyCount(applicantCount + 1)}
                          className="w-9 h-9 rounded-xl border border-masaar-black/20 flex items-center justify-center text-masaar-black hover:bg-warm-ivory"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Live Price Preview */}
                    <div className="border-t border-masaar-black/10 pt-3 flex items-center justify-between text-xs">
                      <span className="text-masaar-black/70">Calculated Family Total:</span>
                      <div className="text-right">
                        <span className="line-through text-masaar-black/40 mr-2">
                          AED {pricing.originalTotal}
                        </span>
                        <span className="font-extrabold text-gold text-base">
                          AED {pricing.finalPayableAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="bg-masaar-black hover:bg-masaar-black/90 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl flex items-center gap-2"
                  >
                    <span>Proceed to Eligibility Check</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: ELIGIBILITY CHECK ── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-masaar-black flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold" />
                  Step 2: Eligibility Verification
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nationality */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-masaar-black/80 block mb-1.5">
                      Passport Nationality
                    </label>
                    <select
                      value={eligibilityNationality}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEligibilityNationality(val);
                        setApplicants((prev) => prev.map((a) => ({ ...a, nationality: val })));
                      }}
                      className="w-full bg-white border border-masaar-black/20 rounded-xl px-4 py-3 text-xs font-medium text-masaar-black focus:outline-none focus:border-gold"
                    >
                      <option value="India">Indian Passport (Approved)</option>
                      <option value="Pakistan">Pakistani Passport (Approved)</option>
                      <option value="Other">Other Nationality (Manual Review)</option>
                    </select>
                  </div>

                  {/* UAE Residency */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-masaar-black/80 block mb-1.5">
                      Current Residence
                    </label>
                    <select
                      value={isUaeResident ? "yes" : "no"}
                      onChange={(e) => setIsUaeResident(e.target.value === "yes")}
                      className="w-full bg-white border border-masaar-black/20 rounded-xl px-4 py-3 text-xs font-medium text-masaar-black focus:outline-none focus:border-gold"
                    >
                      <option value="yes">UAE Resident (Holds Valid Residence Visa)</option>
                      <option value="no">Non-UAE Resident</option>
                    </select>
                  </div>

                  {/* Travel Purpose */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-masaar-black/80 block mb-1.5">
                      Purpose of Travel
                    </label>
                    <select
                      value={travelPurpose}
                      onChange={(e) => setTravelPurpose(e.target.value)}
                      className="w-full bg-white border border-masaar-black/20 rounded-xl px-4 py-3 text-xs font-medium text-masaar-black focus:outline-none focus:border-gold"
                    >
                      <option value="Umrah">Umrah & Tourism</option>
                      <option value="Tourism">Leisure / Tourism</option>
                      <option value="Family Visit">Visiting Family / Relatives</option>
                    </select>
                  </div>

                  {/* Intended Travel Date */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-masaar-black/80 block mb-1.5">
                      Intended Travel Date
                    </label>
                    <input
                      type="date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      className="w-full bg-white border border-masaar-black/20 rounded-xl px-4 py-3 text-xs font-medium text-masaar-black focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                {/* Validity Confirmations */}
                <div className="bg-white p-4 rounded-xl border border-masaar-black/10 space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={passportValidMonths}
                      onChange={(e) => setPassportValidMonths(e.target.checked)}
                      className="mt-0.5 rounded text-gold focus:ring-gold"
                    />
                    <span className="text-xs text-masaar-black/80">
                      Passport has at least <strong>6 months remaining validity</strong> from intended date of entry.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={residenceValidMonths}
                      onChange={(e) => setResidenceValidMonths(e.target.checked)}
                      className="mt-0.5 rounded text-gold focus:ring-gold"
                    />
                    <span className="text-xs text-masaar-black/80">
                      UAE Residence Visa has at least <strong>3 months remaining validity</strong>.
                    </span>
                  </label>
                </div>

                {/* Nationality Warning If not approved */}
                {!isEligibleNationality && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs text-amber-800 space-y-2">
                    <div className="flex items-start gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                      <span>Additional Eligibility Verification Required</span>
                    </div>
                    <p>
                      Your nationality requires additional eligibility verification. Please contact our visa team before proceeding.
                    </p>
                    <a
                      href={heroWhatsAppUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-bold text-amber-900 underline mt-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Contact Visa Team on WhatsApp
                    </a>
                  </div>
                )}

                <div className="flex justify-between pt-4 border-t border-masaar-black/10">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-semibold text-masaar-black/60 hover:text-masaar-black"
                  >
                    Back to Step 1
                  </button>

                  <button
                    type="button"
                    disabled={!isEligibleNationality || !isUaeResident || !passportValidMonths || !residenceValidMonths}
                    onClick={() => {
                      trackMetaPixel("EligibilityCheck", {
                        nationality: eligibilityNationality,
                        eligible: true,
                      });
                      setCurrentStep(3);
                    }}
                    className="bg-masaar-black hover:bg-masaar-black/90 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Confirm & Enter Details</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 3: APPLICANT DETAILS ── */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-masaar-black flex items-center gap-2">
                    <User className="w-5 h-5 text-gold" />
                    Step 3: Applicant Details ({applicants.length} Total)
                  </h3>
                </div>

                {/* Primary Contact Information */}
                <div className="bg-white p-5 rounded-2xl border border-masaar-black/10 space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-masaar-black block">
                    Primary Contact Information (For Visa Delivery & Updates)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] font-semibold text-masaar-black/70 block mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. name@example.com"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        className="w-full bg-warm-ivory/30 border border-masaar-black/20 rounded-xl px-4 py-2.5 text-xs text-masaar-black focus:outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-masaar-black/70 block mb-1">
                        UAE Mobile Number (WhatsApp) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +971 50 123 4567"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="w-full bg-warm-ivory/30 border border-masaar-black/20 rounded-xl px-4 py-2.5 text-xs text-masaar-black focus:outline-none focus:border-gold"
                      />
                    </div>
                  </div>
                </div>

                {/* Applicant Tabs for Family */}
                {applicants.length > 1 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {applicants.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveApplicantIndex(idx)}
                        className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                          activeApplicantIndex === idx
                            ? "bg-masaar-black text-gold border border-gold"
                            : "bg-white text-masaar-black/70 border border-masaar-black/10 hover:bg-warm-ivory"
                        }`}
                      >
                        {idx === 0 ? "Applicant 1 (Primary)" : `Applicant ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                )}

                {/* Current Active Applicant Form */}
                {(() => {
                  const currentApp = applicants[activeApplicantIndex] || EMPTY_APPLICANT;
                  return (
                    <div className="bg-white p-6 rounded-2xl border border-masaar-black/10 space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-masaar-black/5">
                        <span className="text-xs font-bold uppercase tracking-wider text-gold">
                          {activeApplicantIndex === 0
                            ? "Applicant 1 — Primary Applicant"
                            : `Applicant ${activeApplicantIndex + 1} — Family Member`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[11px] font-semibold text-masaar-black/70 block mb-1">
                            Full Name (Exactly as shown on Passport) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. MOHAMMED AHMED ALI"
                            value={currentApp.fullName}
                            onChange={(e) =>
                              handleApplicantChange(activeApplicantIndex, "fullName", e.target.value)
                            }
                            className="w-full bg-warm-ivory/20 border border-masaar-black/20 rounded-xl px-4 py-2.5 text-xs text-masaar-black focus:outline-none focus:border-gold"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-masaar-black/70 block mb-1">
                            Date of Birth *
                          </label>
                          <input
                            type="date"
                            required
                            value={currentApp.dateOfBirth}
                            onChange={(e) =>
                              handleApplicantChange(activeApplicantIndex, "dateOfBirth", e.target.value)
                            }
                            className="w-full bg-warm-ivory/20 border border-masaar-black/20 rounded-xl px-4 py-2.5 text-xs text-masaar-black focus:outline-none focus:border-gold"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-masaar-black/70 block mb-1">
                            Gender *
                          </label>
                          <select
                            value={currentApp.gender}
                            onChange={(e) =>
                              handleApplicantChange(activeApplicantIndex, "gender", e.target.value)
                            }
                            className="w-full bg-warm-ivory/20 border border-masaar-black/20 rounded-xl px-4 py-2.5 text-xs text-masaar-black focus:outline-none focus:border-gold"
                          >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-masaar-black/70 block mb-1">
                            Passport Nationality *
                          </label>
                          <input
                            type="text"
                            disabled
                            value={currentApp.nationality}
                            className="w-full bg-warm-ivory/50 border border-masaar-black/10 rounded-xl px-4 py-2.5 text-xs text-masaar-black/70 cursor-not-allowed"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-masaar-black/70 block mb-1">
                            Passport Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Z1234567"
                            value={currentApp.passportNumber}
                            onChange={(e) =>
                              handleApplicantChange(activeApplicantIndex, "passportNumber", e.target.value)
                            }
                            className="w-full bg-warm-ivory/20 border border-masaar-black/20 rounded-xl px-4 py-2.5 text-xs text-masaar-black focus:outline-none focus:border-gold uppercase"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-semibold text-masaar-black/70 block mb-1">
                            Passport Expiry Date * (Min. 6 Months Validity)
                          </label>
                          <input
                            type="date"
                            required
                            value={currentApp.passportExpiryDate}
                            onChange={(e) =>
                              handleApplicantChange(activeApplicantIndex, "passportExpiryDate", e.target.value)
                            }
                            className="w-full bg-warm-ivory/20 border border-masaar-black/20 rounded-xl px-4 py-2.5 text-xs text-masaar-black focus:outline-none focus:border-gold"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex justify-between pt-4 border-t border-masaar-black/10">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="text-xs font-semibold text-masaar-black/60 hover:text-masaar-black"
                  >
                    Back to Eligibility
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="bg-masaar-black hover:bg-masaar-black/90 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl flex items-center gap-2"
                  >
                    <span>Proceed to Document Upload</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 4: DOCUMENT UPLOAD ── */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-masaar-black flex items-center gap-2">
                    <Upload className="w-5 h-5 text-gold" />
                    Step 4: Secure Document Upload
                  </h3>
                  <span className="text-xs text-masaar-black/60">PDF, JPG, JPEG, PNG (Max 5MB)</span>
                </div>

                <div className="bg-gold/10 border border-gold/30 rounded-xl p-3.5 text-xs text-masaar-black/80 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                  <span>
                    Your documents are encrypted and uploaded directly to secure private storage. They will only be accessed by authorized Masaar visa specialists.
                  </span>
                </div>

                {/* Upload Slots For Each Applicant */}
                <div className="space-y-6">
                  {applicants.map((app, appIdx) => (
                    <div key={appIdx} className="bg-white p-5 rounded-2xl border border-masaar-black/10 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-gold text-masaar-black text-xs font-bold flex items-center justify-center">
                          {appIdx + 1}
                        </span>
                        <span className="font-bold text-sm text-masaar-black">
                          {app.fullName.trim() ? app.fullName : `Applicant ${appIdx + 1}`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {(["passport", "photo", "emirates_id"] as const).map((docType) => {
                          const slotKey = `${appIdx}_${docType}`;
                          const isUploading = !!uploadingSlots[slotKey];
                          const uploaded = uploadedDocs.find(
                            (d) => d.applicantIndex === appIdx && d.documentType === docType
                          );

                          const labelMap = {
                            passport: "Passport Copy",
                            photo: "Passport Size Photo",
                            emirates_id: "Emirates ID Copy",
                          };

                          return (
                            <div
                              key={docType}
                              className={`p-4 rounded-xl border-2 transition-all flex flex-col justify-between ${
                                uploaded
                                  ? "bg-emerald-50/60 border-emerald-300"
                                  : "bg-warm-ivory/20 border-dashed border-masaar-black/20 hover:border-gold"
                              }`}
                            >
                              <div>
                                <span className="text-xs font-bold text-masaar-black block mb-1">
                                  {labelMap[docType]}
                                </span>
                                {uploaded ? (
                                  <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-semibold mt-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[130px]" title={uploaded.fileName}>
                                      {uploaded.fileName}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-masaar-black/50 block">
                                    Required document
                                  </span>
                                )}
                              </div>

                              <div className="mt-3">
                                <label className="cursor-pointer inline-flex items-center justify-center gap-1.5 w-full bg-white hover:bg-warm-ivory text-masaar-black border border-masaar-black/20 text-[11px] font-bold py-2 px-3 rounded-lg shadow-sm">
                                  <Upload className="w-3.5 h-3.5 text-gold" />
                                  <span>{isUploading ? "Uploading..." : uploaded ? "Replace" : "Upload File"}</span>
                                  <input
                                    type="file"
                                    accept=".pdf,image/jpeg,image/png,image/webp"
                                    disabled={isUploading}
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleFileUpload(appIdx, docType, file);
                                    }}
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4 border-t border-masaar-black/10">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="text-xs font-semibold text-masaar-black/60 hover:text-masaar-black"
                  >
                    Back to Applicant Details
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="bg-masaar-black hover:bg-masaar-black/90 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl flex items-center gap-2"
                  >
                    <span>Review Price & Terms</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 5: PRICE SUMMARY & REFUND TERMS ── */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-masaar-black flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold" />
                  Step 5: Price Summary & Terms Acceptance
                </h3>

                {/* Price Breakdown Table */}
                <div className="bg-white rounded-2xl p-6 border border-masaar-black/10 space-y-3">
                  <div className="flex justify-between text-xs py-1.5 border-b border-masaar-black/5">
                    <span className="text-masaar-black/70">Application Type</span>
                    <span className="font-bold text-masaar-black capitalize">
                      {pricing.applicationType} Application
                    </span>
                  </div>

                  <div className="flex justify-between text-xs py-1.5 border-b border-masaar-black/5">
                    <span className="text-masaar-black/70">Number of Applicants</span>
                    <span className="font-bold text-masaar-black">{pricing.applicantCount}</span>
                  </div>

                  <div className="flex justify-between text-xs py-1.5 border-b border-masaar-black/5">
                    <span className="text-masaar-black/70">Price Per Applicant</span>
                    <span className="font-semibold text-masaar-black">AED {pricing.pricePerApplicant}</span>
                  </div>

                  <div className="flex justify-between text-xs py-1.5 border-b border-masaar-black/5">
                    <span className="text-masaar-black/70">Original Total</span>
                    <span className="font-semibold text-masaar-black">AED {pricing.originalTotal}</span>
                  </div>

                  {pricing.isFamilyDiscountApplied && (
                    <div className="flex justify-between text-xs py-1.5 border-b border-masaar-black/5 text-emerald-700 bg-emerald-50 px-3 rounded-lg">
                      <span className="font-bold">5% Family Application Discount</span>
                      <span className="font-bold">- AED {pricing.familyDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm pt-2 font-bold">
                    <span className="text-masaar-black">Final Payable Amount</span>
                    <span className="text-gold text-lg">
                      AED {pricing.finalPayableAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Refund Terms and Consent Checkbox */}
                <div className="bg-gold/10 border border-gold/30 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black">
                    Masaar Refund Assurance & Conditions
                  </h4>
                  <p className="text-xs text-masaar-black/70 leading-relaxed">
                    Masaar Holidays offers refund assurance if your visa application is rejected by the authorities, subject to our published refund policy terms. Government immigration fees, where non-refundable by official decree, may be excluded.
                  </p>
                  <label className="flex items-start gap-3 cursor-pointer pt-2">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded text-gold focus:ring-gold"
                    />
                    <span className="text-xs text-masaar-black font-semibold">
                      I have read, understood and agree to Masaar's Terms & Conditions, Refund Policy, and certify that all applicant details provided are accurate.
                    </span>
                  </label>
                </div>

                <div className="flex justify-between pt-4 border-t border-masaar-black/10">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-xs font-semibold text-masaar-black/60 hover:text-masaar-black"
                  >
                    Back to Documents
                  </button>

                  <button
                    type="button"
                    disabled={!termsAccepted}
                    onClick={() => setCurrentStep(6)}
                    className="bg-masaar-black hover:bg-masaar-black/90 text-white font-bold text-xs uppercase tracking-wider py-3 px-6 rounded-xl flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 6: ONLINE PAYMENT ── */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-masaar-black flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gold" />
                  Step 6: Complete Online Payment (AED {pricing.finalPayableAmount.toFixed(2)})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Stripe Card Payment */}
                  <div
                    onClick={() => setPaymentGateway("stripe")}
                    className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      paymentGateway === "stripe"
                        ? "border-masaar-black bg-white ring-2 ring-gold/30 shadow-md"
                        : "border-masaar-black/10 bg-white/60 hover:bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-masaar-black">Credit / Debit Card</span>
                        <CreditCard className="w-5 h-5 text-gold" />
                      </div>
                      <p className="text-xs text-masaar-black/60">
                        Visa, Mastercard, Apple Pay, Google Pay secured by Stripe.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-gold mt-4 block">
                      Pay AED {pricing.finalPayableAmount.toFixed(2)} in full
                    </span>
                  </div>

                  {/* Tabby Pay in 4 */}
                  <div
                    onClick={() => setPaymentGateway("tabby")}
                    className={`cursor-pointer p-5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      paymentGateway === "tabby"
                        ? "border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-md"
                        : "border-masaar-black/10 bg-white/60 hover:bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-sm text-masaar-black">Tabby: Pay in 4</span>
                        <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                          Zero Interest
                        </span>
                      </div>
                      <p className="text-xs text-masaar-black/60">
                        Split your application into 4 equal monthly installments of AED{" "}
                        {(pricing.finalPayableAmount / 4).toFixed(2)}.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 mt-4 block">
                      4 × AED {(pricing.finalPayableAmount / 4).toFixed(2)} / month
                    </span>
                  </div>
                </div>

                {/* Submit Checkout Button */}
                <div className="pt-4 space-y-3">
                  <button
                    type="button"
                    disabled={isSubmitting || !termsAccepted}
                    onClick={handleSubmitCheckout}
                    className="w-full bg-[#C9A227] hover:bg-[#b58f1e] text-masaar-black font-extrabold text-sm uppercase tracking-wider py-4 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <span>Connecting to Secure Checkout...</span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>
                          Pay AED {pricing.finalPayableAmount.toFixed(2)} & Complete Application
                        </span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-masaar-black/60">
                    256-bit encrypted checkout. No card numbers are stored on Masaar servers.
                  </p>
                </div>

                <div className="flex justify-between pt-4 border-t border-masaar-black/10">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="text-xs font-semibold text-masaar-black/60 hover:text-masaar-black"
                  >
                    Back to Price Summary
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 7 — REFUND POLICY & PEACE OF MIND
      ───────────────────────────────────────────────────────── */}
      <section className="py-16 bg-warm-ivory border-t border-masaar-black/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gold/30 shadow-lg space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gold/15 flex items-center justify-center text-gold">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-gold block">
                  Trust & Transparency
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-masaar-black font-sans">
                  Apply With Added Peace of Mind.
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-masaar-black/80 leading-relaxed">
              Masaar Holidays offers a refund assurance if your Saudi visa application is rejected, subject to the published terms and conditions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-masaar-black/80 pt-2">
              <div className="bg-warm-ivory/50 p-4 rounded-xl border border-masaar-black/5">
                <strong className="text-masaar-black block mb-1">Clear Terms:</strong>
                Masaar refund rules clearly stipulate what portion of the AED 750 service fee is refundable and the processing timelines involved.
              </div>
              <div className="bg-warm-ivory/50 p-4 rounded-xl border border-masaar-black/5">
                <strong className="text-masaar-black block mb-1">Family Calculations:</strong>
                For group family applications, refunds are calculated per individual applicant outcome without forfeiting the remaining eligible visas.
              </div>
            </div>

            <p className="text-[11px] text-masaar-black/60 italic leading-relaxed pt-2">
              Note: Visa decisions remain under the sovereign authority of the Saudi Ministry of Foreign Affairs and relevant authorities. Masaar Holidays does not make misleading 100% approval guarantees.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 8 — FAQ ACCORDION (16 QUESTIONS)
      ───────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-masaar-black/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-masaar-black font-sans">
              Frequently Asked Questions
            </h2>
            <div className="w-16 h-1 bg-gold mx-auto mt-3 rounded-full" />
            <p className="text-xs sm:text-sm text-masaar-black/70 mt-3">
              Everything you need to know about the Saudi 1-Year Multiple Entry Tourist Visa.
            </p>
          </div>

          <div className="space-y-3">
            {SAUDI_VISA_FAQS.map((faq, idx) => {
              const isOpen = activeFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-warm-ivory/40 border border-masaar-black/10 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaqIndex(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-masaar-black hover:text-gold transition-colors"
                  >
                    <span>{faq.question}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-gold flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-masaar-black/40 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-masaar-black/75 leading-relaxed border-t border-masaar-black/5 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────
          SECTION 9 — DEDICATED LANDING FOOTER
      ───────────────────────────────────────────────────────── */}
      <footer className="bg-masaar-black text-white pt-16 pb-12 border-t border-gold/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-white/10">
            <div className="space-y-2 text-center md:text-left">
              <Link href="/">
                <Image
                  src="/brand/masaar-logo.png"
                  alt="Masaar Holidays Logo"
                  width={160}
                  height={44}
                  className="h-9 w-auto object-contain mx-auto md:mx-0"
                />
              </Link>
              <p className="text-xs text-gold tracking-widest uppercase font-semibold">
                Curated Umrah With Care
              </p>
            </div>

            <div className="flex items-center gap-6 text-xs text-white/70">
              <Link href="/privacy" className="hover:text-gold transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-gold transition-colors">
                Terms and Conditions
              </Link>
              <Link href="/refund-policy" className="hover:text-gold transition-colors">
                Refund Policy
              </Link>
              <a
                href={heroWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gold transition-colors flex items-center gap-1 text-emerald-400 font-semibold"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp Visa Help
              </a>
            </div>
          </div>

          {/* Mandatory Visa Disclaimer */}
          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-[11px] text-white/60 leading-relaxed">
            <strong className="text-white block mb-1">Official Visa & Umrah Disclaimer:</strong>
            Visa eligibility, issuance, validity and permitted stay are subject to Saudi Arabian government regulations and approval by the relevant authorities. Processing timelines are estimates and may vary. Umrah travel is subject to applicable regulations and restrictions. This service does not provide Hajj authorisation.
          </div>

          <div className="text-center text-xs text-white/40">
            <p>© {new Date().getFullYear()} Masaar Holidays. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* ─────────────────────────────────────────────────────────
          FLOATING WHATSAPP BUTTON
      ───────────────────────────────────────────────────────── */}
      <a
        href={applicationType === "family" ? familyWhatsAppUrl : heroWhatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Enquire on WhatsApp"
        className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20ba5a] text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-transform hover:scale-110 group border-2 border-white/30"
      >
        <MessageCircle className="w-7 h-7 fill-white" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pl-0 group-hover:pl-2">
          Chat with Visa Specialist
        </span>
      </a>
    </div>
  );
}
