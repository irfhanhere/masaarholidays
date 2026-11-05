"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/site/Container";
import { CONTACT } from "@/lib/contact";
import { Price } from "@/components/site/Price";
import { calculateVisaPricing } from "@/lib/visa-pricing";
import type { VisaTypeRow, VisaProductRow } from "@/lib/types/database";

interface ApplicantData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  countryOfResidence: string;
  passportNumber: string;
  passportIssueDate?: string;
  passportExpiryDate: string;
  placeOfIssue?: string;
}

interface UploadedDoc {
  documentType: string;
  title: string;
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  previewUrl?: string;
}

interface VisaApplicationFlowProps {
  visaType: VisaTypeRow;
  products: VisaProductRow[];
  tabbyEnabled?: boolean;
  tabbySarAvailable?: boolean;
}

export function VisaApplicationFlow({
  visaType,
  products,
  tabbyEnabled = true,
  tabbySarAvailable = false,
}: VisaApplicationFlowProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialProductId = searchParams.get("product") || products[0]?.id || "";

  // Step state: 1 (Eligibility & Selection), 2 (Applicant Details), 3 (Documents), 4 (Review), 5 (Payment)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Selection & Eligibility
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);
  const [nationality, setNationality] = useState<string>("India");
  const [countryOfResidence, setCountryOfResidence] = useState<string>("United Arab Emirates");
  const [intendedTravelDate, setIntendedTravelDate] = useState<string>("");
  const [purposeOfVisit, setPurposeOfVisit] = useState<string>("Tourism / Visit");
  const [durationOfStay, setDurationOfStay] = useState<string>("Up to 30 Days");
  const [travellersCount, setTravellersCount] = useState<number>(1);

  // Step 2: Applicants Details
  const [applicants, setApplicants] = useState<ApplicantData[]>([
    {
      fullName: "",
      dateOfBirth: "",
      gender: "Male",
      nationality: "India",
      countryOfResidence: "United Arab Emirates",
      passportNumber: "",
      passportExpiryDate: "",
    },
  ]);
  const [activeApplicantIndex, setActiveApplicantIndex] = useState<number>(0);

  // Contact Info
  const [contactEmail, setContactEmail] = useState<string>("");
  const [contactPhone, setContactPhone] = useState<string>("");
  const [dialCode, setDialCode] = useState<string>("+971");

  // Residential Address
  const [resAddress, setResAddress] = useState<string>("");
  const [resCity, setResCity] = useState<string>("");
  const [resState, setResState] = useState<string>("");
  const [resPostalCode, setResPostalCode] = useState<string>("");

  // Step 3: Documents
  const [uploadedDocuments, setUploadedDocuments] = useState<Record<string, UploadedDoc>>({});
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Payment & Terms
  const isThreeStep = true;
  const [selectedGateway, setSelectedGateway] = useState<"stripe" | "tabby">("stripe");
  const [paymentMethod, setPaymentMethod] = useState<string>("card");
  const [sameBillingAddress, setSameBillingAddress] = useState<boolean>(true);
  const [termsAgreed, setTermsAgreed] = useState<boolean>(false);
  const [discretionAgreed, setDiscretionAgreed] = useState<boolean>(false);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  // Adjust applicants array when count changes
  useEffect(() => {
    if (travellersCount > applicants.length) {
      const newApplicants = [...applicants];
      for (let i = applicants.length; i < travellersCount; i++) {
        newApplicants.push({
          fullName: "",
          dateOfBirth: "",
          gender: "Male",
          nationality: nationality || "India",
          countryOfResidence: countryOfResidence || "United Arab Emirates",
          passportNumber: "",
          passportExpiryDate: "",
        });
      }
      setApplicants(newApplicants);
    } else if (travellersCount < applicants.length) {
      setApplicants(applicants.slice(0, travellersCount));
      if (activeApplicantIndex >= travellersCount) {
        setActiveApplicantIndex(0);
      }
    }
  }, [travellersCount, applicants, activeApplicantIndex, nationality, countryOfResidence]);

  const updateApplicantField = (index: number, field: keyof ApplicantData, value: string) => {
    const updated = [...applicants];
    updated[index] = { ...updated[index], [field]: value };
    setApplicants(updated);
  };

  // Pricing calculations
  const count = Math.max(1, travellersCount);
  const isSaudi = visaType.slug === "saudi-tourist" || selectedProduct?.visa_type_slug === "saudi-tourist" || selectedProduct?.currency === "AED";
  const pricing = selectedProduct
    ? calculateVisaPricing(selectedProduct, count)
    : {
        applicantCount: count,
        visaFeeTotal: isSaudi ? 500 * count : 120 * count,
        serviceFeeTotal: isSaudi ? 150 * count : 30 * count,
        processingFeeTotal: isSaudi ? 100 * count : 20 * count,
        subtotalAmount: isSaudi ? 750 * count : 170 * count,
        discountAmount: isSaudi ? 0 : 8.5 * count,
        discountPercent: isSaudi ? 0 : 5,
        totalAmount: isSaudi ? 750 * count : 161.5 * count,
        currency: isSaudi ? "AED" : "USD",
        originalTotalPerPerson: isSaudi ? 750 : 170,
        discountPerPerson: isSaudi ? 0 : 8.5,
        discountedTotalPerPerson: isSaudi ? 750 : 161.5,
      };

  const {
    visaFeeTotal,
    serviceFeeTotal,
    processingFeeTotal,
    subtotalAmount,
    discountAmount,
    totalAmount,
    currency: currencyCode,
    originalTotalPerPerson: originalPerPerson,
    discountedTotalPerPerson: discountedPerPerson,
  } = pricing;

  // Tabby calculations: UAE AED merchant account mhae supports AED only (never send SAR)
  const tabbyCurrency: "AED" = "AED";
  const tabbyRate = 1;
  const tabbyTotalAmount = isSaudi ? (750 * count) : Math.round(totalAmount * 3.6725 * 100) / 100;
  const tabbyInstallmentAmount = Math.round((tabbyTotalAmount / 4) * 100) / 100;
  const isTabbyEligible = tabbyEnabled;

  const hasIneligibleSaudiApplicant = false;

  // File upload handler
  // File upload handler supporting applicant index
  const handleFileUpload = async (
    docKey: string,
    title: string,
    file: File,
    applicantIdx: number = activeApplicantIndex
  ) => {
    const stateKey = isThreeStep || applicants.length > 1 ? `${applicantIdx}_${docKey}` : docKey;
    setUploadingDocType(stateKey);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", `${docKey}_applicant_${applicantIdx + 1}`);

      const res = await fetch("/api/visa/upload-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      const applicantName = applicants[applicantIdx]?.fullName || `Traveller ${applicantIdx + 1}`;

      setUploadedDocuments((prev) => ({
        ...prev,
        [stateKey]: {
          documentType: isThreeStep || applicants.length > 1 ? `${applicantName} — ${title}` : title,
          title,
          filePath: data.filePath,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          previewUrl: data.previewUrl,
        },
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Document upload failed";
      setUploadError(msg);
    } finally {
      setUploadingDocType(null);
    }
  };

  const handleRemoveDoc = (stateKey: string) => {
    setUploadedDocuments((prev) => {
      const copy = { ...prev };
      delete copy[stateKey];
      return copy;
    });
  };

  // 3-Step Validations
  const validateThreeStep1 = () => {
    if (!intendedTravelDate) {
      alert("Please select your intended date of travel.");
      return false;
    }
    if (!purposeOfVisit) {
      alert("Please select your purpose of visit.");
      return false;
    }
    for (let i = 0; i < applicants.length; i++) {
      const a = applicants[i];
      if (!a.fullName || a.fullName.trim().length < 2) {
        alert(`Please enter full name (as per passport) for Traveller ${i + 1}.`);
        setActiveApplicantIndex(i);
        return false;
      }
    }
    if (!contactEmail || !contactEmail.includes("@")) {
      alert("Please enter a valid email address for application updates.");
      return false;
    }
    if (!contactPhone || contactPhone.trim().length < 6) {
      alert("Please enter a valid WhatsApp or phone number.");
      return false;
    }
    return true;
  };

  const validateThreeStep2 = () => {
    for (let i = 0; i < applicants.length; i++) {
      const appName = applicants[i].fullName || `Traveller ${i + 1}`;
      if (!uploadedDocuments[`${i}_passport_front`]) {
        alert(`Please upload Passport Copy for ${appName} to proceed.`);
        setActiveApplicantIndex(i);
        return false;
      }
      if (isSaudi) {
        if (!uploadedDocuments[`${i}_uae_residence_visa`]) {
          alert(`Please upload UAE Residence Visa Copy for ${appName} to proceed.`);
          setActiveApplicantIndex(i);
          return false;
        }
        if (!uploadedDocuments[`${i}_emirates_id`]) {
          alert(`Please upload Emirates ID Copy for ${appName} to proceed.`);
          setActiveApplicantIndex(i);
          return false;
        }
      }
      if (!uploadedDocuments[`${i}_passport_photo`]) {
        alert(`Please upload Passport Size Photo for ${appName} to proceed.`);
        setActiveApplicantIndex(i);
        return false;
      }
    }
    return true;
  };

  // 5-Step Validations (UAE and Other Standard Visas)
  const validateStep1 = () => {
    if (!intendedTravelDate) {
      alert("Please select your intended travel date.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    for (let i = 0; i < applicants.length; i++) {
      const a = applicants[i];
      if (!a.fullName || a.fullName.trim().length < 2) {
        alert(`Please enter full name for Traveller ${i + 1}.`);
        setActiveApplicantIndex(i);
        return false;
      }
      if (!a.passportNumber || a.passportNumber.trim().length < 4) {
        alert(`Please enter passport number for Traveller ${i + 1}.`);
        setActiveApplicantIndex(i);
        return false;
      }
    }
    if (!contactEmail || !contactEmail.includes("@")) {
      alert("Please enter a valid contact email address.");
      return false;
    }
    if (!contactPhone || contactPhone.trim().length < 6) {
      alert("Please enter a valid phone number.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!uploadedDocuments["passport_front"]) {
      alert("Please upload your Passport First Page copy to proceed.");
      return false;
    }
    if (!uploadedDocuments["passport_photo"]) {
      alert("Please upload your Passport Size Photo to proceed.");
      return false;
    }
    if (!uploadedDocuments["passport_address"]) {
      alert("Please upload your Passport Address Page copy to proceed.");
      return false;
    }
    return true;
  };

  const maxSteps = isThreeStep ? 3 : 5;

  const handleNext = () => {
    if (isThreeStep) {
      if (currentStep === 1 && !validateThreeStep1()) return;
      if (currentStep === 2 && !validateThreeStep2()) return;
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      if (currentStep === 1 && !validateStep1()) return;
      if (currentStep === 2 && !validateStep2()) return;
      if (currentStep === 3 && !validateStep3()) return;
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push(`/visa/${visaType.slug}`);
    }
  };

  // Proceed to Checkout
  const handleProceedToPayment = async () => {
    if (!termsAgreed || !discretionAgreed) {
      alert("Please confirm that you agree to the terms and understand authority discretion.");
      return;
    }

    setIsSubmittingCheckout(true);
    setCheckoutError(null);

    try {
      const payload = {
        visaSlug: visaType.slug,
        productId: selectedProduct?.id,
        paymentGateway: isTabbyEligible ? selectedGateway : "stripe",
        nationality,
        countryOfResidence,
        travelDate: intendedTravelDate,
        purposeOfVisit,
        durationOfStay,
        applicants,
        primaryContact: {
          email: contactEmail,
          phone: `${dialCode} ${contactPhone}`.trim(),
        },
        residentialAddress: {
          street: resAddress,
          city: resCity,
          state: resState,
          postalCode: resPostalCode,
          country: countryOfResidence,
        },
        uploadedDocuments: Object.values(uploadedDocuments),
      };

      const res = await fetch("/api/visa/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to initialize payment session");
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No payment session URL returned.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Payment error";
      setCheckoutError(msg);
      setIsSubmittingCheckout(false);
    }
  };

  const stepsMeta = isThreeStep
    ? [
        { num: 1, label: "Package & Travellers" },
        { num: 2, label: "Document Upload" },
        { num: 3, label: "Review & Payment" },
      ]
    : [
        { num: 1, label: "Eligibility & Selection" },
        { num: 2, label: "Applicant Details" },
        { num: 3, label: "Document Upload" },
        { num: 4, label: "Review Application" },
        { num: 5, label: "Secure Payment" },
      ];

  return (
    <div className="min-h-screen bg-warm-ivory/30 pb-24 text-masaar-black">
      {/* Top Breadcrumb */}
      <div className="border-b border-black/5 bg-warm-ivory/60 py-2.5">
        <Container>
          <div className="flex items-center gap-2 text-xs text-masaar-black/60">
            <Link href="/" className="hover:text-masaar-black">Home</Link>
            <span>›</span>
            <Link href="/visa" className="hover:text-masaar-black">Visa</Link>
            <span>›</span>
            <Link href={`/visa/${visaType.slug}`} className="hover:text-masaar-black">{visaType.name}</Link>
            <span>›</span>
            <span className="font-medium text-masaar-black">Apply Online</span>
          </div>
        </Container>
      </div>

      {/* Header Banner */}
      <section className="relative overflow-hidden bg-masaar-black py-12 text-white sm:py-16">
        <Container className="relative z-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-pure-gold">
            — {visaType.name.toUpperCase()} APPLICATION —
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-semibold sm:text-4xl lg:text-5xl">
            {isThreeStep ? (
              <>
                {currentStep === 1 && "Package Selection & Travellers Information"}
                {currentStep === 2 && "Upload Your Documents"}
                {currentStep === 3 && "Review & Secure Payment"}
              </>
            ) : (
              <>
                {currentStep === 1 && "Check Eligibility & Choose Your Visa"}
                {currentStep === 2 && "Applicant Details"}
                {currentStep === 3 && "Upload Your Documents"}
                {currentStep === 4 && "Review Your Application"}
                {currentStep === 5 && "Secure Payment"}
              </>
            )}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-xs text-white/70 sm:text-sm">
            {isThreeStep ? (
              <>
                {currentStep === 1 && "Select your Saudi visa duration and enter traveller details exactly as shown on passports."}
                {currentStep === 2 && "Please upload clear, valid documents according to the required checklist below."}
                {currentStep === 3 && "Verify your application details and choose to pay in full or in 4 installments with Tabby."}
              </>
            ) : (
              <>
                {currentStep === 1 && "Tell us a few details about your travel plans so we can configure the best visa options."}
                {currentStep === 2 && "Please fill in each traveller's information exactly as it appears on their passport."}
                {currentStep === 3 && "Please upload clear, valid documents according to the required checklist below."}
                {currentStep === 4 && "Please verify all traveller details, documents, and pricing before proceeding to payment."}
                {currentStep === 5 && "Complete your payment safely through 256-bit encrypted checkout to submit your application."}
              </>
            )}
          </p>

          {/* Stepper Progress Bar (V04 - V09) */}
          <div className="mx-auto mt-8 max-w-3xl">
            <div className="flex items-center justify-between">
              {stepsMeta.map((s, idx) => {
                const isPassed = currentStep > s.num;
                const isCurrent = currentStep === s.num;
                return (
                  <React.Fragment key={s.num}>
                    <div className="flex flex-col items-center">
                      <span
                        className={`flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all sm:size-9 ${
                          isPassed
                            ? "bg-pure-gold text-masaar-black"
                            : isCurrent
                            ? "bg-pure-gold text-masaar-black ring-4 ring-pure-gold/30"
                            : "bg-white/20 text-white/70"
                        }`}
                      >
                        {isPassed ? (
                          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          s.num
                        )}
                      </span>
                      <span
                        className={`mt-2 hidden text-[11px] font-medium sm:block ${
                          isCurrent ? "text-pure-gold" : "text-white/60"
                        }`}
                      >
                        {s.label}
                      </span>
                    </div>
                    {idx < stepsMeta.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 transition-all ${
                          currentStep > s.num ? "bg-pure-gold" : "bg-white/20"
                        }`}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* Main Workflow Layout: Left Form + Right Summary Card */}
      <Container className="mt-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* LEFT: STEP CONTENT */}
          <div className="space-y-8">
            {/* ========================================================================= */}
            {/* 3-STEP FLOW: STEP 1 — PACKAGE SELECTION & TRAVELLER DETAILS */}
            {/* ========================================================================= */}
            {isThreeStep && currentStep === 1 && (
              <div className="space-y-6">
                {/* 1. Visa Package Selection */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                    <span className="flex size-7 items-center justify-center rounded-full bg-pure-gold text-xs font-bold text-masaar-black">
                      1
                    </span>
                    <div>
                      <h2 className="font-semibold text-masaar-black text-sm">Saudi Tourist Visa Package</h2>
                      <p className="text-[11px] text-masaar-black/60">Official single visa service for UAE residents holding Indian or Pakistani passports.</p>
                    </div>
                  </div>

                  <div className="mt-5 max-w-lg">
                    <div className="relative rounded-xl border border-pure-gold bg-pure-gold/5 p-5 shadow-sm ring-2 ring-pure-gold/30">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-flex items-center rounded-full bg-pure-gold px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-masaar-black">
                            Approved Product
                          </span>
                          <h3 className="mt-2 font-semibold text-masaar-black text-base">
                            Saudi 1-Year Multiple Entry Tourist Visa
                          </h3>
                          <p className="mt-0.5 text-xs text-masaar-black/70">
                            Exclusively for UAE Residents (Indian & Pakistani Passports)
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 border-t border-black/10 pt-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-masaar-black">
                            <Price amountAed={750} />
                          </span>
                          <span className="text-xs text-masaar-black/60 font-medium">/ applicant</span>
                        </div>
                        <p className="mt-1 text-[11px] text-masaar-black/60">
                          1 Year Validity · Multiple Entry · Up to 90 Days / Visit · ~2–3 Working Days Processing
                        </p>
                        <p className="mt-2 rounded-md bg-white p-2 text-[11px] font-medium text-masaar-black/80 border border-black/5">
                          💳 Or 4 monthly installments of <Price amountAed={187.5} /> with Tabby
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Number of Travellers & Travel Dates */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                    <span className="flex size-7 items-center justify-center rounded-full bg-pure-gold text-xs font-bold text-masaar-black">
                      2
                    </span>
                    <div>
                      <h2 className="font-semibold text-masaar-black text-sm">Travel Details</h2>
                      <p className="text-[11px] text-masaar-black/60">Select number of travellers and intended travel dates.</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Number of Travellers <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={travellersCount}
                        onChange={(e) => setTravellersCount(Number(e.target.value))}
                        aria-label="Number of Travellers"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      >
                        <option value={1}>1 Traveller (Solo)</option>
                        <option value={2}>2 Travellers</option>
                        <option value={3}>3 Travellers</option>
                        <option value={4}>4 Travellers</option>
                        <option value={5}>5 Travellers</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Intended Date of Travel <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={intendedTravelDate}
                        onChange={(e) => setIntendedTravelDate(e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Purpose of Visit <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={purposeOfVisit}
                        onChange={(e) => setPurposeOfVisit(e.target.value)}
                        aria-label="Purpose of Visit"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      >
                        <option value="Tourism / Visit">Tourism / Leisure</option>
                        <option value="Umrah">Umrah (Outside restricted Hajj period)</option>
                        <option value="Family Visit">Visiting Family / Relatives</option>
                        <option value="Events / Culture">Events / Concerts / Sports</option>
                        <option value="Transit">Transit / Short Layover</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Primary Contact Information */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                    <span className="flex size-7 items-center justify-center rounded-full bg-pure-gold text-xs font-bold text-masaar-black">
                      3
                    </span>
                    <div>
                      <h2 className="font-semibold text-masaar-black text-sm">Primary Contact (Order Updates & Delivery)</h2>
                      <p className="text-[11px] text-masaar-black/60">We will deliver your electronic visa and real-time status updates here.</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. yourname@example.com"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        WhatsApp Number <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1.5 flex gap-2">
                        <select
                          value={dialCode}
                          onChange={(e) => setDialCode(e.target.value)}
                          aria-label="Country Dial Code"
                          className="w-24 rounded-md border border-black/15 bg-warm-ivory/20 px-2 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                        >
                          <option value="+966">🇸🇦 +966</option>
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+92">🇵🇰 +92</option>
                          <option value="+974">🇶🇦 +974</option>
                          <option value="+965">🇰🇼 +965</option>
                          <option value="+968">🇴🇲 +968</option>
                          <option value="+973">🇧🇭 +973</option>
                        </select>
                        <input
                          type="tel"
                          required
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="50 123 4567"
                          className="flex-1 rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Applicant Details (As Shown on Passport) */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 pb-4">
                    <div className="flex items-center gap-3">
                      <span className="flex size-7 items-center justify-center rounded-full bg-pure-gold text-xs font-bold text-masaar-black">
                        4
                      </span>
                      <div>
                        <h2 className="font-semibold text-masaar-black text-sm">
                          Traveller Name
                        </h2>
                        <p className="text-[11px] text-masaar-black/60">
                          Please enter the full legal name as shown on the applicant&apos;s passport.
                        </p>
                      </div>
                    </div>

                    {applicants.length > 1 && (
                      <span className="rounded bg-pure-gold/15 px-2 py-0.5 text-xs font-bold text-deep-gold">
                        Traveller {activeApplicantIndex + 1} of {applicants.length}
                      </span>
                    )}
                  </div>

                  {/* Multi-traveller tabs */}
                  {applicants.length > 1 && (
                    <div className="mt-4 flex gap-2 overflow-x-auto border-b border-black/5 pb-2">
                      {applicants.map((app, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveApplicantIndex(i)}
                          className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                            activeApplicantIndex === i
                              ? "bg-pure-gold text-masaar-black shadow-2xs"
                              : "bg-warm-ivory/50 text-masaar-black/70 hover:bg-warm-ivory"
                          }`}
                        >
                          Traveller {i + 1} {app.fullName ? `(${app.fullName.split(" ")[0]})` : ""}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-5">
                    <label className="block text-xs font-semibold text-masaar-black">
                      Full Name (as per passport) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={applicants[activeApplicantIndex].fullName}
                      onChange={(e) => updateApplicantField(activeApplicantIndex, "fullName", e.target.value)}
                      placeholder="e.g. MOHAMMED AHMED ALI"
                      className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs uppercase text-masaar-black focus:border-pure-gold focus:outline-none"
                    />
                    <p className="mt-1.5 text-[11px] text-masaar-black/50">
                      Passport details and residence information will be verified directly from your uploaded documents in the next step.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 3-STEP FLOW: STEP 2 — UPLOAD DOCUMENTS */}
            {/* ========================================================================= */}
            {isThreeStep && currentStep === 2 && (
              <div className="space-y-6">
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-black/5 pb-4">
                    <div>
                      <h2 className="font-semibold text-masaar-black text-sm">
                        Upload Required Documents
                      </h2>
                      <p className="text-[11px] text-masaar-black/60">
                        Accepted formats: JPG, PNG, PDF · Maximum 5 MB per document
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                      Encrypted & Private Storage
                    </span>
                  </div>

                  {uploadError && (
                    <div className="mt-4 rounded bg-red-50 p-3 text-xs text-red-600">
                      {uploadError}
                    </div>
                  )}

                  {/* Multi-applicant tabs in Step 2 */}
                  {applicants.length > 1 && (
                    <div className="mt-5 border-b border-black/10 pb-3">
                      <p className="text-xs font-semibold text-masaar-black mb-2">Select Applicant:</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {applicants.map((app, i) => {
                          const isDone = isSaudi
                            ? !!uploadedDocuments[`${i}_passport_front`] &&
                              !!uploadedDocuments[`${i}_uae_residence_visa`] &&
                              !!uploadedDocuments[`${i}_emirates_id`] &&
                              !!uploadedDocuments[`${i}_passport_photo`]
                            : !!uploadedDocuments[`${i}_passport_front`] &&
                              !!uploadedDocuments[`${i}_passport_photo`] &&
                              (selectedProduct?.id !== "saudi-transit-96h" || !!uploadedDocuments[`${i}_flight_ticket`]);

                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setActiveApplicantIndex(i)}
                              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                                activeApplicantIndex === i
                                  ? "bg-pure-gold text-masaar-black shadow-xs ring-2 ring-pure-gold/30"
                                  : "bg-warm-ivory/50 text-masaar-black/70 hover:bg-warm-ivory"
                              }`}
                            >
                              <span>Traveller {i + 1} {app.fullName ? `(${app.fullName.split(" ")[0]})` : ""}</span>
                              {isDone ? (
                                <span className="rounded-full bg-emerald-600 text-white p-0.5">
                                  <svg className="size-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </span>
                              ) : (
                                <span className="size-2 rounded-full bg-amber-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Document upload checklist for activeApplicantIndex */}
                  <div className="mt-6 space-y-4">
                    {(isSaudi
                      ? [
                          {
                            key: "passport_front",
                            title: "1. Passport Copy (Bio-Data Page)",
                            desc: "Clear colour scan of passport bio-data page (minimum 6 months remaining validity).",
                            required: true,
                          },
                          {
                            key: "uae_residence_visa",
                            title: "2. UAE Residence Visa Copy",
                            desc: "Valid UAE residence visa copy (minimum 3 months remaining validity).",
                            required: true,
                          },
                          {
                            key: "emirates_id",
                            title: "3. Emirates ID Copy",
                            desc: "Clear copy of front & back of Emirates ID (minimum 3 months remaining validity).",
                            required: true,
                          },
                          {
                            key: "passport_photo",
                            title: "4. Passport-Size Photograph",
                            desc: "Recent colour photo with white background taken within the last 6 months (JPG, PNG).",
                            required: true,
                          },
                        ]
                      : [
                          {
                            key: "passport_front",
                            title: "1. Passport First Page",
                            desc: "Clear colour scan of passport bio-data page (minimum 6 months remaining validity).",
                            required: true,
                          },
                          {
                            key: "passport_photo",
                            title: "2. Passport Size Photograph",
                            desc: "Recent colour photo with white background taken within the last 6 months (JPG, PNG).",
                            required: true,
                          },
                          ...(selectedProduct?.id === "saudi-transit-96h"
                            ? [
                                {
                                  key: "flight_ticket",
                                  title: "3. Confirmed Onward Flight Ticket",
                                  desc: "Confirmed flight booking showing transit / onward flight within 96 hours.",
                                  required: true,
                                },
                              ]
                            : []),
                          {
                            key: "accommodation_proof",
                            title: selectedProduct?.id === "saudi-transit-96h" ? "4. Hotel / Host Details" : "3. Accommodation / Host Address",
                            desc: "Confirmed hotel reservation or residential address of host in Saudi Arabia.",
                            required: false,
                          },
                        ]
                    ).map((item) => {
                      const stateKey = `${activeApplicantIndex}_${item.key}`;
                      const uploaded = uploadedDocuments[stateKey];
                      const isUploading = uploadingDocType === stateKey;

                      return (
                        <div
                          key={item.key}
                          className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="max-w-md">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-masaar-black text-xs sm:text-sm">{item.title}</h3>
                              {item.required ? (
                                <span className="rounded bg-pure-gold/20 px-1.5 py-0.5 text-[9px] font-bold text-deep-gold">
                                  Required
                                </span>
                              ) : (
                                <span className="rounded bg-black/5 px-1.5 py-0.5 text-[9px] font-medium text-masaar-black/60">
                                  Optional
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-masaar-black/60">{item.desc}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            {uploaded ? (
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {uploaded.fileName.slice(0, 16)}...
                                </span>
                                <label className="cursor-pointer text-xs font-medium text-amber-700 hover:underline">
                                  <input
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    disabled={isUploading}
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleFileUpload(item.key, item.title, f, activeApplicantIndex);
                                    }}
                                    className="hidden"
                                  />
                                  Replace
                                </label>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(stateKey)}
                                  className="text-xs text-red-500 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-pure-gold bg-warm-ivory/50 px-4 py-2.5 text-xs font-semibold text-masaar-black transition-all hover:bg-pure-gold/20">
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.pdf"
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFileUpload(item.key, item.title, f, activeApplicantIndex);
                                  }}
                                  className="hidden"
                                />
                                {isUploading ? (
                                  <span>Uploading...</span>
                                ) : (
                                  <>
                                    <svg className="size-4 text-deep-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span>Upload Document</span>
                                  </>
                                )}
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-pure-gold/30 bg-warm-ivory p-4 text-xs text-masaar-black/75">
                  <span className="font-semibold text-deep-gold">Data Privacy & Security: </span>
                  All uploaded documents are stored in private encrypted storage. Access is strictly limited to authorized visa processing specialists and destination immigration authorities.
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 3-STEP FLOW: STEP 3 — REVIEW & PAY */}
            {/* ========================================================================= */}
            {isThreeStep && currentStep === 3 && (
              <div className="space-y-6">
                {/* 1. Visa Package Summary */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 pb-3">
                    <h2 className="font-semibold text-masaar-black text-sm">1. Selected Visa Package</h2>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-semibold text-deep-gold hover:underline"
                    >
                      Edit Package
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-masaar-black">{selectedProduct?.title}</p>
                      <p className="text-masaar-black/60">{selectedProduct?.duration} · {selectedProduct?.entry_type} Entry · Turnaround: {selectedProduct?.processing_time || "1-3 Working Days"}</p>
                    </div>
                    <div className="text-right">
                      {isSaudi ? (
                        <div>
                          <p className="font-[family-name:var(--font-display)] text-lg font-bold text-masaar-black">
                            AED 750 / person
                          </p>
                          <p className="text-[11px] text-emerald-700 font-semibold">
                            Fixed approved rate for UAE residents
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-end gap-1.5 text-[10px]">
                            <span className="text-masaar-black/40 line-through">USD {originalPerPerson}</span>
                            <span className="rounded bg-emerald-50 px-1 py-0.2 text-[9px] font-bold text-emerald-700">Save 5%</span>
                          </div>
                          <p className="font-[family-name:var(--font-display)] text-lg font-bold text-masaar-black">
                            USD {discountedPerPerson} / person
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Travellers Information Summary */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 pb-3">
                    <h2 className="font-semibold text-masaar-black text-sm">
                      2. Traveller Information ({applicants.length} {applicants.length === 1 ? "Traveller" : "Travellers"})
                    </h2>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="text-xs font-semibold text-deep-gold hover:underline"
                    >
                      Edit Travellers
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {applicants.map((a, i) => (
                      <div key={i} className="rounded border border-black/5 bg-warm-ivory/20 p-3 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="font-semibold text-masaar-black">Traveller {i + 1}: {a.fullName || "Applicant"}</p>
                          <p className="text-[11px] text-masaar-black/60 mt-0.5">
                            Purpose: <span className="font-medium text-masaar-black">{purposeOfVisit}</span> · Travel Date: <span className="font-medium text-masaar-black">{intendedTravelDate}</span>
                          </p>
                        </div>
                        <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Documents Attached
                        </span>
                      </div>
                    ))}
                    <div className="mt-2 text-xs text-masaar-black/70">
                      <p>Lead Contact: <span className="font-medium text-masaar-black">{contactEmail}</span> · <span className="font-medium text-masaar-black">{dialCode} {contactPhone}</span></p>
                    </div>
                  </div>
                </div>

                {/* 3. Document Checklist Status */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 pb-3">
                    <h2 className="font-semibold text-masaar-black text-sm">3. Uploaded Document Status</h2>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="text-xs font-semibold text-deep-gold hover:underline"
                    >
                      Edit Documents
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {applicants.map((a, idx) => (
                      <div key={idx} className="rounded-lg border border-black/5 bg-neutral-50/50 p-3 text-xs">
                        <p className="font-semibold text-masaar-black mb-1.5">
                          Traveller {idx + 1}: {a.fullName || "Applicant"}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {isSaudi ? (
                            <>
                              {uploadedDocuments[`${idx}_passport_front`] ? (
                                <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                                  ✓ Passport Copy ({uploadedDocuments[`${idx}_passport_front`].fileName})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800 border border-rose-200">
                                  ✗ Passport Copy Missing
                                </span>
                              )}
                              {uploadedDocuments[`${idx}_uae_residence_visa`] ? (
                                <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                                  ✓ UAE Residence Visa ({uploadedDocuments[`${idx}_uae_residence_visa`].fileName})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800 border border-rose-200">
                                  ✗ UAE Residence Visa Missing
                                </span>
                              )}
                              {uploadedDocuments[`${idx}_emirates_id`] ? (
                                <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                                  ✓ Emirates ID Copy ({uploadedDocuments[`${idx}_emirates_id`].fileName})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800 border border-rose-200">
                                  ✗ Emirates ID Copy Missing
                                </span>
                              )}
                              {uploadedDocuments[`${idx}_passport_photo`] ? (
                                <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                                  ✓ Passport Photo ({uploadedDocuments[`${idx}_passport_photo`].fileName})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800 border border-rose-200">
                                  ✗ Passport Photo Missing
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              {uploadedDocuments[`${idx}_passport_front`] ? (
                                <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                                  ✓ Passport First Page ({uploadedDocuments[`${idx}_passport_front`].fileName})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800 border border-rose-200">
                                  ✗ Passport First Page Missing
                                </span>
                              )}
                              {uploadedDocuments[`${idx}_passport_photo`] ? (
                                <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                                  ✓ Passport Photograph ({uploadedDocuments[`${idx}_passport_photo`].fileName})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800 border border-rose-200">
                                  ✗ Passport Photo Missing
                                </span>
                              )}
                              {selectedProduct?.id === "saudi-transit-96h" && (
                                uploadedDocuments[`${idx}_flight_ticket`] ? (
                                  <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                                    ✓ Flight Ticket ({uploadedDocuments[`${idx}_flight_ticket`].fileName})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 rounded bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-800 border border-rose-200">
                                    ✗ Onward Flight Ticket Missing
                                  </span>
                                )
                              )}
                              {uploadedDocuments[`${idx}_accommodation_proof`] && (
                                <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800 border border-emerald-200">
                                  ✓ Accommodation ({uploadedDocuments[`${idx}_accommodation_proof`].fileName})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Select Payment Method */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-masaar-black text-sm">Select Payment Method</h2>
                      <p className="text-[11px] text-masaar-black/60">
                        Pay in full securely by Card, or split into 4 equal monthly installments with Tabby.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Zero Extra Surcharges
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Option 1: Credit / Debit Card (Stripe) */}
                    <button
                      type="button"
                      onClick={() => setSelectedGateway("stripe")}
                      className={`relative flex flex-col items-start rounded-xl border p-4.5 text-left transition-all ${
                        selectedGateway === "stripe"
                          ? "border-pure-gold bg-pure-gold/5 ring-2 ring-pure-gold/30 shadow-xs"
                          : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-bold text-masaar-black">Credit / Debit Card</span>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-masaar-black/70">
                          <span>Visa</span>
                          <span>•</span>
                          <span>MC</span>
                          <span>•</span>
                          <span>Amex</span>
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] text-masaar-black/70">
                        Secure 256-bit encrypted card checkout via Stripe.
                      </p>
                      <div className="mt-3 flex items-baseline gap-1 text-sm font-bold text-masaar-black">
                        <span>Pay in Full:</span>
                        <span className="text-deep-gold">
                          {isSaudi ? `AED ${totalAmount}` : `USD ${totalAmount}`}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
                        <span>✓ Instant confirmation</span>
                        <span>•</span>
                        <span>✓ Apple & Google Pay</span>
                      </div>
                    </button>

                    {/* Option 2: Tabby (Pay in 4) */}
                    <button
                      type="button"
                      onClick={() => setSelectedGateway("tabby")}
                      className={`relative flex flex-col items-start rounded-xl border p-4.5 text-left transition-all ${
                        selectedGateway === "tabby"
                          ? "border-[#3EEDB4] bg-[#3EEDB4]/5 ring-2 ring-[#3EEDB4]/40 shadow-xs"
                          : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-[#3EEDB4] px-2 py-0.5 font-[family-name:var(--font-display)] text-xs font-black text-black">
                            tabby
                          </span>
                          <span className="text-xs font-bold text-masaar-black">Split in 4</span>
                        </div>
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                          0% Interest · Sharia-Compliant
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-masaar-black/70">
                        4 monthly payments of AED {tabbyInstallmentAmount}. No hidden fees.
                      </p>
                      <div className="mt-3 flex items-baseline gap-1.5 text-sm font-bold text-masaar-black">
                        <span>Total:</span>
                        <span className="text-emerald-700 font-bold">AED {tabbyTotalAmount}</span>
                        <span className="text-[10px] text-masaar-black/50 font-normal">
                          (AED {tabbyInstallmentAmount}/mo)
                        </span>
                      </div>
                      <div className="mt-2 text-[10px] text-emerald-700 font-medium">
                        <span>✓ 25% today, remainder over 3 months</span>
                      </div>
                    </button>
                  </div>

                  {/* Tabby breakdown schedule box when selected */}
                  {selectedGateway === "tabby" && (
                    <div className="mt-4 rounded-xl border border-[#3EEDB4]/40 bg-[#3EEDB4]/10 p-4 text-xs">
                      <div className="flex items-center justify-between border-b border-black/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#3EEDB4] text-[10px] font-bold text-black">
                            4
                          </span>
                          <span className="font-semibold text-masaar-black">Your Tabby Payment Plan</span>
                        </div>
                        <span className="text-[11px] text-masaar-black/60 font-medium">
                          {isSaudi ? "Processed in AED (UAE Merchant Account)" : `Pegged Rate: 1 USD = ${tabbyRate} ${tabbyCurrency}`}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
                        <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-black/5">
                          <p className="text-[10px] text-masaar-black/60 font-medium">1st Payment</p>
                          <p className="mt-1 font-bold text-masaar-black text-xs">AED {tabbyInstallmentAmount}</p>
                          <p className="text-[9px] text-emerald-700 font-semibold mt-0.5">Due Today (25%)</p>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-black/5">
                          <p className="text-[10px] text-masaar-black/60 font-medium">2nd Payment</p>
                          <p className="mt-1 font-bold text-masaar-black text-xs">AED {tabbyInstallmentAmount}</p>
                          <p className="text-[9px] text-masaar-black/50 mt-0.5">In 1 Month</p>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-black/5">
                          <p className="text-[10px] text-masaar-black/60 font-medium">3rd Payment</p>
                          <p className="mt-1 font-bold text-masaar-black text-xs">AED {tabbyInstallmentAmount}</p>
                          <p className="text-[9px] text-masaar-black/50 mt-0.5">In 2 Months</p>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-black/5">
                          <p className="text-[10px] text-masaar-black/60 font-medium">4th Payment</p>
                          <p className="mt-1 font-bold text-masaar-black text-xs">AED {tabbyInstallmentAmount}</p>
                          <p className="text-[9px] text-masaar-black/50 mt-0.5">In 3 Months</p>
                        </div>
                      </div>

                      <p className="mt-2.5 text-[11px] text-masaar-black/70">
                        You will be redirected securely to Tabby to verify with your mobile number and National ID.
                      </p>
                    </div>
                  )}

                  {/* Explicit Checkout Charge Currency Disclosure */}
                  <div className="mt-4 rounded-lg border border-pure-gold/40 bg-pure-gold/10 p-3 text-xs text-masaar-black">
                    <span className="font-semibold text-deep-gold">Payment Currency Disclosure: </span>
                    {isSaudi ? (
                      <span>
                        Your transaction will be charged directly in <strong>AED (United Arab Emirates Dirham)</strong>. Total payable amount: <strong>AED {totalAmount}</strong> for {count} {count === 1 ? "applicant" : "applicants"}. No currency conversion markup applies.
                      </span>
                    ) : (
                      <span>
                        Your transaction will be charged in <strong>USD (US Dollars)</strong> at checkout. Total payable amount: <strong>USD {totalAmount}</strong>.
                      </span>
                    )}
                  </div>
                </div>

                {/* 5. Terms, Privacy & Important Authority Discretion Disclaimer */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm space-y-4">
                  <h2 className="font-semibold text-masaar-black text-sm">Confirmation & Legal Acknowledgement</h2>

                  {/* Prominent Alert Box */}
                  <div className="rounded-lg border border-amber-300 bg-amber-50/80 p-3.5 text-xs text-amber-900 flex items-start gap-3">
                    <span className="text-amber-600 text-base font-bold">⚠️</span>
                    <div>
                      <p className="font-bold">Important Visa Processing & Refund Notice:</p>
                      <p className="mt-0.5 leading-relaxed">
                        Payment of the visa application fee does not guarantee visa issuance. Final approval or rejection rests entirely with the Ministry of Foreign Affairs / destination immigration authorities. Once an application is submitted to authorities, all government fees and processing charges are strictly non-refundable.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 text-xs text-masaar-black/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="mt-0.5 text-pure-gold"
                    />
                    <span>
                      I confirm that all provided details and uploaded documents match official passport records, and I accept the{" "}
                      <Link href="/terms" target="_blank" className="text-deep-gold underline">
                        Terms & Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" target="_blank" className="text-deep-gold underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-masaar-black/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={discretionAgreed}
                      onChange={(e) => setDiscretionAgreed(e.target.checked)}
                      className="mt-0.5 text-pure-gold"
                    />
                    <span>
                      I understand and agree that visa granting is at the sole discretion of the destination immigration authority, and payment does not guarantee approval. Fees are non-refundable once processed.
                    </span>
                  </label>
                </div>

                {checkoutError && (
                  <div className="rounded-lg bg-red-50 p-4 text-xs text-red-600">
                    {checkoutError}
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5-STEP FLOW: STEP 1 — ELIGIBILITY & VISA SELECTION */}
            {/* ========================================================================= */}
            {!isThreeStep && currentStep === 1 && (
              <div className="space-y-6">
                {/* 1. Nationality & Residency */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                    <span className="flex size-7 items-center justify-center rounded-full bg-pure-gold text-xs font-bold text-masaar-black">
                      1
                    </span>
                    <div>
                      <h2 className="font-semibold text-masaar-black text-sm">Your Nationality & Residency</h2>
                      <p className="text-[11px] text-masaar-black/60">This helps us show the visa options available for you.</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Nationality <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={nationality}
                        onChange={(e) => setNationality(e.target.value)}
                        aria-label="Nationality"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      >
                        <option value="India">India</option>
                        <option value="Pakistan">Pakistan</option>
                        <option value="Bangladesh">Bangladesh</option>
                        <option value="Philippines">Philippines</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="Egypt">Egypt</option>
                        <option value="Jordan">Jordan</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Country of Residence <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={countryOfResidence}
                        onChange={(e) => setCountryOfResidence(e.target.value)}
                        aria-label="Country of Residence"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      >
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="United States">United States</option>
                        <option value="India">India</option>
                        <option value="Qatar">Qatar</option>
                        <option value="Kuwait">Kuwait</option>
                        <option value="Oman">Oman</option>
                        <option value="Bahrain">Bahrain</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Travel Details */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                    <span className="flex size-7 items-center justify-center rounded-full bg-pure-gold text-xs font-bold text-masaar-black">
                      2
                    </span>
                    <div>
                      <h2 className="font-semibold text-masaar-black text-sm">Your Travel Details</h2>
                      <p className="text-[11px] text-masaar-black/60">Provide your planned travel dates and purpose of visit.</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Intended Date of Travel <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={intendedTravelDate}
                        onChange={(e) => setIntendedTravelDate(e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Purpose of Visit <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={purposeOfVisit}
                        onChange={(e) => setPurposeOfVisit(e.target.value)}
                        aria-label="Purpose of Visit"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      >
                        <option value="Tourism / Visit">Tourism / Visit</option>
                        <option value="Business Meetings">Business Meetings</option>
                        <option value="Family Visit">Family Visit</option>
                        <option value="Transit">Transit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Expected Duration of Stay
                      </label>
                      <select
                        value={durationOfStay}
                        onChange={(e) => setDurationOfStay(e.target.value)}
                        aria-label="Expected Duration of Stay"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      >
                        <option value="Up to 30 Days">Up to 30 Days</option>
                        <option value="30 to 60 Days">30 to 60 Days</option>
                        <option value="60 to 90 Days">60 to 90 Days</option>
                        <option value="More than 90 Days">More than 90 Days</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Number of Travellers <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={travellersCount}
                        onChange={(e) => setTravellersCount(Number(e.target.value))}
                        aria-label="Number of Travellers"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      >
                        <option value={1}>1 Traveller</option>
                        <option value={2}>2 Travellers</option>
                        <option value={3}>3 Travellers</option>
                        <option value={4}>4 Travellers</option>
                        <option value={5}>5 Travellers</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. Available Visa Options */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                    <span className="flex size-7 items-center justify-center rounded-full bg-pure-gold text-xs font-bold text-masaar-black">
                      3
                    </span>
                    <div>
                      <h2 className="font-semibold text-masaar-black text-sm">Available {visaType.name} Options</h2>
                      <p className="text-[11px] text-masaar-black/60">Select your preferred visa package.</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {products.map((p) => {
                      const isSelected = p.id === selectedProductId;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedProductId(p.id)}
                          className={`relative cursor-pointer rounded-xl border p-4 transition-all ${
                            isSelected
                              ? "border-pure-gold bg-pure-gold/5 shadow-sm ring-2 ring-pure-gold/30"
                              : "border-black/10 bg-white hover:border-black/25"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`flex size-4 items-center justify-center rounded-full border ${
                                  isSelected
                                    ? "border-pure-gold bg-pure-gold"
                                    : "border-black/30 bg-white"
                                }`}
                              >
                                {isSelected && <span className="size-1.5 rounded-full bg-masaar-black" />}
                              </span>
                              <h3 className="font-semibold text-masaar-black text-xs sm:text-sm">{p.title}</h3>
                            </div>
                            {p.is_popular && (
                              <span className="rounded bg-pure-gold/20 px-1.5 py-0.5 text-[9px] font-bold text-deep-gold uppercase">
                                Popular
                              </span>
                            )}
                          </div>

                          {(() => {
                            const pDisc = Math.round(p.total_usd * 0.05 * 100) / 100;
                            const pNet = Math.round((p.total_usd - pDisc) * 100) / 100;
                            return (
                              <div className="mt-3">
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <span className="text-masaar-black/40 line-through">USD {p.total_usd}</span>
                                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700 border border-emerald-200">
                                    Save 5%
                                  </span>
                                </div>
                                <div className="mt-0.5 flex items-baseline gap-1">
                                  <span className="text-[11px] text-masaar-black/60">USD</span>
                                  <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                                    {pNet}
                                  </span>
                                  <span className="text-[10px] text-masaar-black/50">/ person</span>
                                </div>
                              </div>
                            );
                          })()}

                          <ul className="mt-3 space-y-1 text-[11px] text-masaar-black/75">
                            {p.inclusions.slice(0, 3).map((inc, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="text-deep-gold">✓</span>
                                <span>{inc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notice */}
                <div className="rounded-xl border border-pure-gold/30 bg-warm-ivory p-4 text-xs text-masaar-black/75">
                  <span className="font-semibold text-deep-gold">Price & Eligibility: </span>
                  Visa fees and validity are driven by destination authority guidelines. Final verified fees are itemised before payment.
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5-STEP FLOW: STEP 2 — APPLICANT DETAILS */}
            {/* ========================================================================= */}
            {!isThreeStep && currentStep === 2 && (
              <div className="space-y-6">
                {/* Multi-applicant Tab Selector */}
                {applicants.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto border-b border-black/10 pb-2">
                    {applicants.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setActiveApplicantIndex(i)}
                        className={`rounded-md px-4 py-2 text-xs font-semibold transition-all ${
                          activeApplicantIndex === i
                            ? "bg-pure-gold text-masaar-black shadow-sm"
                            : "bg-white text-masaar-black/70 hover:bg-black/5"
                        }`}
                      >
                        Traveller {i + 1} {applicants[i].fullName ? `(${applicants[i].fullName.split(" ")[0]})` : ""}
                      </button>
                    ))}
                  </div>
                )}

                {/* Traveller Form */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-3 border-b border-black/5 pb-4">
                    <span className="flex size-7 items-center justify-center rounded-full bg-pure-gold text-xs font-bold text-masaar-black">
                      {activeApplicantIndex + 1}
                    </span>
                    <div>
                      <h2 className="font-semibold text-masaar-black text-sm">
                        Traveller {activeApplicantIndex + 1} Information
                      </h2>
                      <p className="text-[11px] text-masaar-black/60">Enter passport details accurately.</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-masaar-black">
                        Full Name (as per passport) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={applicants[activeApplicantIndex].fullName}
                        onChange={(e) => updateApplicantField(activeApplicantIndex, "fullName", e.target.value)}
                        placeholder="e.g. MOHAMMED ALI"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Date of Birth <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={applicants[activeApplicantIndex].dateOfBirth}
                        onChange={(e) => updateApplicantField(activeApplicantIndex, "dateOfBirth", e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Gender <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={applicants[activeApplicantIndex].gender}
                        onChange={(e) => updateApplicantField(activeApplicantIndex, "gender", e.target.value)}
                        aria-label="Gender"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Nationality <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={applicants[activeApplicantIndex].nationality}
                        onChange={(e) => updateApplicantField(activeApplicantIndex, "nationality", e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Country of Residence <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={applicants[activeApplicantIndex].countryOfResidence}
                        onChange={(e) => updateApplicantField(activeApplicantIndex, "countryOfResidence", e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Passport Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={applicants[activeApplicantIndex].passportNumber}
                        onChange={(e) => updateApplicantField(activeApplicantIndex, "passportNumber", e.target.value)}
                        placeholder="e.g. P1234567"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs uppercase text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Passport Expiry Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={applicants[activeApplicantIndex].passportExpiryDate}
                        onChange={(e) => updateApplicantField(activeApplicantIndex, "passportExpiryDate", e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Primary Contact & Notification Details */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <h2 className="font-semibold text-masaar-black text-sm">Contact Information</h2>
                  <p className="text-[11px] text-masaar-black/60">We will use this to send visa status updates and delivery.</p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="e.g. yourname@example.com"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">
                        Phone / WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <div className="mt-1.5 flex gap-2">
                        <select
                          value={dialCode}
                          onChange={(e) => setDialCode(e.target.value)}
                          aria-label="Phone Dial Code"
                          className="w-24 rounded-md border border-black/15 bg-warm-ivory/20 px-2 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                        >
                          <option value="+971">🇦🇪 +971</option>
                          <option value="+966">🇸🇦 +966</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+92">🇵🇰 +92</option>
                        </select>
                        <input
                          type="tel"
                          required
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          placeholder="50 123 4567"
                          className="flex-1 rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Residential Address */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <h2 className="font-semibold text-masaar-black text-sm">Residential Address</h2>
                  <p className="text-[11px] text-masaar-black/60">Current residential address of the applicant.</p>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-masaar-black">
                        Street Address / Building
                      </label>
                      <input
                        type="text"
                        value={resAddress}
                        onChange={(e) => setResAddress(e.target.value)}
                        placeholder="Building, street name, area"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">City</label>
                      <input
                        type="text"
                        value={resCity}
                        onChange={(e) => setResCity(e.target.value)}
                        placeholder="City"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">State / Province</label>
                      <input
                        type="text"
                        value={resState}
                        onChange={(e) => setResState(e.target.value)}
                        placeholder="State"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-masaar-black">Postal Code</label>
                      <input
                        type="text"
                        value={resPostalCode}
                        onChange={(e) => setResPostalCode(e.target.value)}
                        placeholder="Postal Code"
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5-STEP FLOW: STEP 3 — DOCUMENT UPLOAD */}
            {/* ========================================================================= */}
            {!isThreeStep && currentStep === 3 && (
              <div className="space-y-6">
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 pb-4">
                    <div>
                      <h2 className="font-semibold text-masaar-black text-sm">Document Checklist</h2>
                      <p className="text-[11px] text-masaar-black/60">
                        Accepted formats: JPG, PNG, PDF · Max file size: 5 MB per file
                      </p>
                    </div>
                  </div>

                  {uploadError && (
                    <div className="mt-4 rounded bg-red-50 p-3 text-xs text-red-600">
                      {uploadError}
                    </div>
                  )}

                  <div className="mt-6 space-y-4">
                    {[
                      {
                        key: "passport_front",
                        title: "1. Passport First Page",
                        desc: "Clear, coloured copy of the passport's bio-data page showing photo, name, and validity.",
                        required: true,
                      },
                      {
                        key: "passport_photo",
                        title: "2. Passport Size Photo",
                        desc: "Recent passport-size photo with white background (within the last 6 months).",
                        required: true,
                      },
                      {
                        key: "passport_address",
                        title: "3. Passport Address Page",
                        desc: "Clear copy of the passport's address page showing resident address and details.",
                        required: true,
                      },
                    ].map((item) => {
                      const uploaded = uploadedDocuments[item.key];
                      const isUploading = uploadingDocType === item.key;
                      return (
                        <div
                          key={item.key}
                          className="flex flex-col gap-3 rounded-lg border border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="max-w-md">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-masaar-black text-xs sm:text-sm">{item.title}</h3>
                              {item.required ? (
                                <span className="rounded bg-pure-gold/20 px-1.5 py-0.5 text-[9px] font-bold text-deep-gold">
                                  Required
                                </span>
                              ) : (
                                <span className="rounded bg-black/5 px-1.5 py-0.5 text-[9px] font-medium text-masaar-black/60">
                                  Optional
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-[11px] text-masaar-black/60">{item.desc}</p>
                          </div>

                          <div className="flex items-center gap-3">
                            {uploaded ? (
                              <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                                  <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {uploaded.fileName.slice(0, 16)}...
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDoc(item.key)}
                                  className="text-xs text-red-500 hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            ) : (
                              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-pure-gold bg-warm-ivory/50 px-4 py-2.5 text-xs font-semibold text-masaar-black transition-all hover:bg-pure-gold/20">
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.pdf"
                                  disabled={isUploading}
                                  onChange={(e) => {
                                    const f = e.target.files?.[0];
                                    if (f) handleFileUpload(item.key, item.title, f);
                                  }}
                                  className="hidden"
                                />
                                {isUploading ? (
                                  <span>Uploading...</span>
                                ) : (
                                  <>
                                    <svg className="size-4 text-deep-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span>Upload Document</span>
                                  </>
                                )}
                              </label>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border border-pure-gold/30 bg-warm-ivory p-4 text-xs text-masaar-black/75">
                  <span className="font-semibold text-deep-gold">Data Privacy & Security: </span>
                  All uploaded documents are securely encrypted in private cloud storage. We never share your sensitive passport information with unauthorized third parties.
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5-STEP FLOW: STEP 4 — REVIEW APPLICATION */}
            {/* ========================================================================= */}
            {!isThreeStep && currentStep === 4 && (
              <div className="space-y-6">
                {/* 1. Visa Selection Summary */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 pb-3">
                    <h2 className="font-semibold text-masaar-black text-sm">1. Visa Selection</h2>
                    <button onClick={() => setCurrentStep(1)} className="text-xs text-deep-gold hover:underline">
                      Edit
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-masaar-black">{selectedProduct?.title}</p>
                      <p className="text-masaar-black/60">{selectedProduct?.duration} · {selectedProduct?.entry_type} Entry</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5 text-[10px]">
                        <span className="text-masaar-black/40 line-through">USD {originalPerPerson}</span>
                        <span className="rounded bg-emerald-50 px-1 py-0.2 text-[9px] font-bold text-emerald-700">Save 5%</span>
                      </div>
                      <p className="font-[family-name:var(--font-display)] text-lg font-bold text-masaar-black">
                        USD {discountedPerPerson} / person
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Traveller Details Summary */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 pb-3">
                    <h2 className="font-semibold text-masaar-black text-sm">2. Traveller Details</h2>
                    <button onClick={() => setCurrentStep(2)} className="text-xs text-deep-gold hover:underline">
                      Edit
                    </button>
                  </div>
                  <div className="mt-3 space-y-3">
                    {applicants.map((a, i) => (
                      <div key={i} className="rounded border border-black/5 bg-warm-ivory/20 p-3 text-xs">
                        <p className="font-semibold text-masaar-black">Traveller {i + 1}: {a.fullName}</p>
                        <div className="mt-1 grid grid-cols-2 gap-2 text-masaar-black/70 sm:grid-cols-4">
                          <p>Passport: <span className="font-mono">{a.passportNumber}</span></p>
                          <p>DOB: {a.dateOfBirth}</p>
                          <p>Nationality: {a.nationality}</p>
                          <p>Gender: {a.gender}</p>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2 text-xs text-masaar-black/70">
                      <p>Contact: <span className="font-medium">{contactEmail}</span> · <span className="font-medium">{dialCode} {contactPhone}</span></p>
                    </div>
                  </div>
                </div>

                {/* 3. Documents Uploaded Summary */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-black/5 pb-3">
                    <h2 className="font-semibold text-masaar-black text-sm">3. Documents Attached</h2>
                    <button onClick={() => setCurrentStep(3)} className="text-xs text-deep-gold hover:underline">
                      Edit
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.values(uploadedDocuments).map((doc, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 rounded bg-pure-gold/15 px-2.5 py-1 text-xs font-medium text-masaar-black"
                      >
                        ✓ {doc.title} ({doc.fileName})
                      </span>
                    ))}
                  </div>
                </div>

                {/* Terms Notice */}
                <div className="rounded-xl border border-pure-gold/30 bg-warm-ivory p-4 text-xs text-masaar-black/75">
                  <p className="font-semibold text-deep-gold">Important Reminder:</p>
                  <p className="mt-1">
                    Please ensure all information matches passport details exactly. Once submitted to immigration authorities, visa fees are non-refundable.
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5-STEP FLOW: STEP 5 — SECURE PAYMENT */}
            {/* ========================================================================= */}
            {!isThreeStep && currentStep === 5 && (
              <div className="space-y-6">
                {/* Payment Gateway Selection */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-semibold text-masaar-black text-sm">Select Payment Method</h2>
                      <p className="text-[11px] text-masaar-black/60">
                        Choose to pay in full securely by Card, or split into 4 equal monthly installments with Tabby.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Zero Extra Surcharges
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Option 1: Credit / Debit Card (Stripe) */}
                    <button
                      type="button"
                      onClick={() => setSelectedGateway("stripe")}
                      className={`relative flex flex-col items-start rounded-xl border p-4.5 text-left transition-all ${
                        selectedGateway === "stripe"
                          ? "border-pure-gold bg-pure-gold/5 ring-2 ring-pure-gold/30 shadow-xs"
                          : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-bold text-masaar-black">Credit / Debit Card</span>
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-masaar-black/70">
                          <span>Visa</span>
                          <span>•</span>
                          <span>MC</span>
                          <span>•</span>
                          <span>Amex</span>
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] text-masaar-black/70">
                        Secure 256-bit encrypted card checkout via Stripe.
                      </p>
                      <div className="mt-3 flex items-baseline gap-1 text-sm font-bold text-masaar-black">
                        <span>Pay in Full:</span>
                        <span className="text-deep-gold">USD {totalAmount}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium">
                        <span>✓ Instant confirmation</span>
                        <span>•</span>
                        <span>✓ Apple & Google Pay</span>
                      </div>
                    </button>

                    {/* Option 2: Tabby (Pay in 4) */}
                    <button
                      type="button"
                      disabled={!isTabbyEligible}
                      onClick={() => {
                        if (isTabbyEligible) setSelectedGateway("tabby");
                      }}
                      className={`relative flex flex-col items-start rounded-xl border p-4.5 text-left transition-all ${
                        !isTabbyEligible
                          ? "border-black/10 bg-black/[0.02] opacity-75 cursor-not-allowed"
                          : selectedGateway === "tabby"
                          ? "border-[#3EEDB4] bg-[#3EEDB4]/5 ring-2 ring-[#3EEDB4]/40 shadow-xs"
                          : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-md bg-[#3EEDB4] px-2 py-0.5 font-[family-name:var(--font-display)] text-xs font-black text-black">
                            tabby
                          </span>
                          <span className="text-xs font-bold text-masaar-black">Split in 4</span>
                        </div>
                        {!isTabbyEligible ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                            Unavailable
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            0% Interest · Sharia-Compliant
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-masaar-black/70">
                        {!isTabbyEligible
                          ? "Tabby Pay in 4 is currently offline. Please use card payment."
                          : `4 monthly payments of ${tabbyCurrency} ${tabbyInstallmentAmount}. No hidden fees.`}
                      </p>
                      {isTabbyEligible ? (
                        <>
                          <div className="mt-3 flex items-baseline gap-1.5 text-sm font-bold text-masaar-black">
                            <span>Total:</span>
                            <span className="text-emerald-700 font-bold">{tabbyCurrency} {tabbyTotalAmount}</span>
                            <span className="text-[10px] text-masaar-black/50 font-normal">
                              ({tabbyCurrency} {tabbyInstallmentAmount}/mo)
                            </span>
                          </div>
                          <div className="mt-2 text-[10px] text-emerald-700 font-medium">
                            <span>✓ 25% today, remainder over 3 months</span>
                          </div>
                        </>
                      ) : (
                        <div className="mt-3 text-[10px] font-medium text-amber-800">
                          Please select Card Payment to proceed.
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Tabby breakdown schedule box when selected */}
                  {selectedGateway === "tabby" && isTabbyEligible && (
                    <div className="mt-4 rounded-xl border border-[#3EEDB4]/40 bg-[#3EEDB4]/10 p-4 text-xs">
                      <div className="flex items-center justify-between border-b border-black/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#3EEDB4] text-[10px] font-bold text-black">
                            4
                          </span>
                          <span className="font-semibold text-masaar-black">Your Tabby Payment Plan</span>
                        </div>
                        <span className="text-[11px] text-masaar-black/60 font-medium">
                          Pegged Rate: 1 USD = {tabbyRate} {tabbyCurrency}
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
                        <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-black/5">
                          <p className="text-[10px] text-masaar-black/60 font-medium">1st Payment</p>
                          <p className="mt-1 font-bold text-masaar-black text-xs">{tabbyCurrency} {tabbyInstallmentAmount}</p>
                          <p className="text-[9px] text-emerald-700 font-semibold mt-0.5">Due Today (25%)</p>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-black/5">
                          <p className="text-[10px] text-masaar-black/60 font-medium">2nd Payment</p>
                          <p className="mt-1 font-bold text-masaar-black text-xs">{tabbyCurrency} {tabbyInstallmentAmount}</p>
                          <p className="text-[9px] text-masaar-black/50 mt-0.5">In 1 Month</p>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-black/5">
                          <p className="text-[10px] text-masaar-black/60 font-medium">3rd Payment</p>
                          <p className="mt-1 font-bold text-masaar-black text-xs">{tabbyCurrency} {tabbyInstallmentAmount}</p>
                          <p className="text-[9px] text-masaar-black/50 mt-0.5">In 2 Months</p>
                        </div>
                        <div className="rounded-lg bg-white p-2.5 shadow-2xs border border-black/5">
                          <p className="text-[10px] text-masaar-black/60 font-medium">4th Payment</p>
                          <p className="mt-1 font-bold text-masaar-black text-xs">{tabbyCurrency} {tabbyInstallmentAmount}</p>
                          <p className="text-[9px] text-masaar-black/50 mt-0.5">In 3 Months</p>
                        </div>
                      </div>

                      <p className="mt-2.5 text-[11px] text-masaar-black/70">
                        You will be redirected securely to Tabby to verify with your mobile number and National ID / Emirates ID.
                      </p>
                    </div>
                  )}
                </div>

                {/* Billing Address Option */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <h2 className="font-semibold text-masaar-black text-sm">Billing Address</h2>
                  <div className="mt-3 flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs font-medium text-masaar-black">
                      <input
                        type="radio"
                        checked={sameBillingAddress}
                        onChange={() => setSameBillingAddress(true)}
                        className="text-pure-gold"
                      />
                      <span>Same as traveller residential address</span>
                    </label>
                  </div>
                </div>

                {/* Terms and Discretion Checkboxes */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm space-y-3">
                  <h2 className="font-semibold text-masaar-black text-sm">Confirmation & Terms</h2>

                  <label className="flex items-start gap-2.5 text-xs text-masaar-black/80">
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={(e) => setTermsAgreed(e.target.checked)}
                      className="mt-0.5 text-pure-gold"
                    />
                    <span>
                      I confirm that all provided details and documents are genuine and accurate, and I accept the{" "}
                      <Link href="/terms" target="_blank" className="text-deep-gold underline">
                        Terms & Conditions
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" target="_blank" className="text-deep-gold underline">
                        Privacy Policy
                      </Link>
                      .
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-masaar-black/80">
                    <input
                      type="checkbox"
                      checked={discretionAgreed}
                      onChange={(e) => setDiscretionAgreed(e.target.checked)}
                      className="mt-0.5 text-pure-gold"
                    />
                    <span>
                      I understand that visa issuance is at the sole discretion of the relevant immigration authorities, and visa fees are non-refundable once processed.
                    </span>
                  </label>
                </div>

                {checkoutError && (
                  <div className="rounded-lg bg-red-50 p-4 text-xs text-red-600">
                    {checkoutError}
                  </div>
                )}
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmittingCheckout}
                className="rounded-md border border-black/20 bg-white px-5 py-3 text-xs font-semibold text-masaar-black transition-all hover:bg-black/5"
              >
                Back
              </button>

              {currentStep < (isThreeStep ? 3 : 5) ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-md bg-pure-gold px-7 py-3 text-xs font-semibold text-masaar-black shadow-md transition-all hover:bg-light-gold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {currentStep === 2 ? "Continue to Payment →" : "Continue →"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isSubmittingCheckout || !termsAgreed || !discretionAgreed}
                  className="flex items-center gap-2 rounded-md bg-pure-gold px-8 py-3.5 text-xs font-semibold text-masaar-black shadow-lg transition-all hover:bg-light-gold active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSubmittingCheckout ? (
                    <span>Connecting to Secure Payment...</span>
                  ) : selectedGateway === "tabby" && isTabbyEligible ? (
                    <>
                      <span className="inline-flex rounded-sm bg-black px-1.5 py-0.5 text-[10px] font-black text-[#3EEDB4]">
                        tabby
                      </span>
                      <span>Pay AED {tabbyTotalAmount} in 4 Installments →</span>
                    </>
                  ) : (
                    <>
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Pay {isSaudi ? `AED ${totalAmount}` : `USD ${totalAmount}`} Securely →</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: STICKY ORDER SUMMARY CARD */}
          <div>
            <div className="sticky top-20 rounded-xl border border-black/10 bg-white p-6 shadow-sm">
              <h2 className="border-b border-black/5 pb-3 font-semibold text-masaar-black text-sm">
                Order Summary
              </h2>

              <div className="mt-4 flex items-center gap-3">
                <div className="relative size-12 overflow-hidden rounded-lg bg-warm-ivory">
                  <Image
                    src={
                      visaType.slug === "uae"
                        ? "/brand/banners/uae.webp"
                        : visaType.hero_image_url || "/trips/destination-image.webp"
                    }
                    alt={visaType.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-masaar-black text-xs">{visaType.name}</h3>
                  <p className="text-[11px] text-masaar-black/60">{selectedProduct?.title}</p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mt-6 space-y-2.5 border-t border-black/5 pt-4 text-xs">
                {isSaudi ? (
                  <>
                    <div className="flex justify-between text-masaar-black/70">
                      <span>Saudi Tourist Visa ({count}x)</span>
                      <span>AED {500 * count}</span>
                    </div>
                    <div className="flex justify-between text-masaar-black/70">
                      <span>Service Fee</span>
                      <span>AED {150 * count}</span>
                    </div>
                    <div className="flex justify-between text-masaar-black/70">
                      <span>Processing Fee</span>
                      <span>AED {100 * count}</span>
                    </div>
                    <div className="flex justify-between text-masaar-black/60 border-t border-black/5 pt-2">
                      <span>Subtotal</span>
                      <span>AED {750 * count}</span>
                    </div>
                    <div className="flex justify-between border-t border-black/10 pt-3 text-sm font-bold text-masaar-black">
                      <span>Total Amount</span>
                      <div className="text-right">
                        <span className="font-[family-name:var(--font-display)] text-lg text-deep-gold">
                          AED {totalAmount}
                        </span>
                        {selectedGateway === "tabby" && (
                          <div className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                            = AED {tabbyTotalAmount} (AED {tabbyInstallmentAmount}/mo)
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="rounded-md bg-warm-ivory p-2 text-[10px] text-masaar-black/70">
                      <span className="font-semibold text-deep-gold">Charge Currency:</span> AED (United Arab Emirates Dirham). Stored base rate: AED 750 / applicant.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-masaar-black/70">
                      <span>Visa Fee ({count}x)</span>
                      <span>USD {visaFeeTotal}</span>
                    </div>
                    <div className="flex justify-between text-masaar-black/70">
                      <span>Service Fee</span>
                      <span>USD {serviceFeeTotal}</span>
                    </div>
                    <div className="flex justify-between text-masaar-black/70">
                      <span>Processing Fee</span>
                      <span>USD {processingFeeTotal}</span>
                    </div>
                    <div className="flex justify-between text-masaar-black/60 border-t border-black/5 pt-2">
                      <span>Subtotal</span>
                      <span>USD {subtotalAmount}</span>
                    </div>
                    <div className="flex justify-between font-medium text-emerald-700">
                      <span>5% Online Discount</span>
                      <span>-USD {discountAmount}</span>
                    </div>
                    <div className="flex justify-between border-t border-black/10 pt-3 text-sm font-bold text-masaar-black">
                      <span>Total Amount</span>
                      <div className="text-right">
                        <span className="font-[family-name:var(--font-display)] text-lg text-deep-gold">
                          USD {totalAmount}
                        </span>
                        {selectedGateway === "tabby" && (
                          <div className="mt-0.5 text-[11px] font-semibold text-emerald-700">
                            = {tabbyCurrency} {tabbyTotalAmount} ({tabbyCurrency} {tabbyInstallmentAmount}/mo)
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedGateway === "tabby" && (
                      <div className="rounded-md bg-emerald-50/70 p-2 text-[10px] text-emerald-800">
                        <span className="font-semibold">Pegged Exchange Rate:</span> 1 USD = {tabbyRate} {tabbyCurrency}. No surcharge or interest applied.
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Guarantees */}
              <div className="mt-6 rounded-lg bg-warm-ivory/60 p-3.5 text-[11px] text-masaar-black/80 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <span>✓</span>
                  <span>256-bit SSL encrypted checkout</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <span>✓</span>
                  <span>Dedicated visa expert review</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <span>✓</span>
                  <span>Real-time email and tracking status</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <span>✓</span>
                  <span>Tabby Pay in 4 installment option</span>
                </div>
              </div>

              {/* Need Help Box */}
              <div className="mt-6 border-t border-black/5 pt-4 text-center">
                <p className="text-xs font-semibold text-masaar-black">Need Help Applying?</p>
                <p className="mt-1 text-[11px] text-masaar-black/60">Our visa experts are available on WhatsApp.</p>
                <a
                  href={`https://wa.me/${CONTACT.whatsappPhoneIntl}?text=${encodeURIComponent(
                    `Hello Masaar Holidays, I need help with my ${visaType.name} online application.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-md bg-warm-ivory py-2.5 text-xs font-semibold text-deep-gold hover:bg-warm-ivory/80"
                >
                  WhatsApp Assistance
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
