"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Container } from "@/components/site/Container";
import { CONTACT } from "@/lib/contact";
import type { VisaTypeRow, VisaProductRow } from "@/lib/types/database";

interface ApplicantData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  countryOfResidence: string;
  passportNumber: string;
  passportIssueDate: string;
  passportExpiryDate: string;
  placeOfIssue: string;
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
}

export function VisaApplicationFlow({ visaType, products }: VisaApplicationFlowProps) {
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
      passportIssueDate: "",
      passportExpiryDate: "",
      placeOfIssue: "",
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

  // Step 5: Payment & Terms
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
          passportIssueDate: "",
          passportExpiryDate: "",
          placeOfIssue: "",
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
  const visaFeeTotal = (selectedProduct?.visa_fee_usd || 80) * count;
  const serviceFeeTotal = (selectedProduct?.service_fee_usd || 20) * count;
  const processingFeeTotal = (selectedProduct?.processing_fee_usd || 10) * count;
  const totalAmount = visaFeeTotal + serviceFeeTotal + processingFeeTotal;

  // File upload handler
  const handleFileUpload = async (documentType: string, title: string, file: File) => {
    setUploadingDocType(documentType);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);

      const res = await fetch("/api/visa/upload-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadedDocuments((prev) => ({
        ...prev,
        [documentType]: {
          documentType,
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

  const handleRemoveDoc = (docType: string) => {
    setUploadedDocuments((prev) => {
      const copy = { ...prev };
      delete copy[docType];
      return copy;
    });
  };

  // Navigation validations
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
      alert("Please upload at least the Passport First Page copy to proceed.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
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

  // Step 5: Proceed to Checkout
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
        // Redirect securely to Stripe Checkout
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

  const stepsMeta = [
    { num: 1, label: "Eligibility & Selection" },
    { num: 2, label: "Applicant Details" },
    { num: 3, label: "Document Upload" },
    { num: 4, label: "Review & Payment" },
    { num: 5, label: "Confirmation" },
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
            {currentStep === 1 && "Check Eligibility & Choose Your Visa"}
            {currentStep === 2 && "Applicant Details"}
            {currentStep === 3 && "Upload Your Documents"}
            {currentStep === 4 && "Review Your Application"}
            {currentStep === 5 && "Secure Payment"}
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-xs text-white/70 sm:text-sm">
            {currentStep === 1 && "Tell us a few details about your travel plans so we can configure the best visa options."}
            {currentStep === 2 && "Please fill in each traveller's information exactly as it appears on their passport."}
            {currentStep === 3 && "Please upload clear, valid documents according to the required checklist below."}
            {currentStep === 4 && "Please verify all traveller details, documents, and pricing before proceeding to payment."}
            {currentStep === 5 && "Complete your payment safely through 256-bit encrypted checkout to submit your application."}
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
            {/* STEP 1: ELIGIBILITY & VISA SELECTION */}
            {currentStep === 1 && (
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

                          <div className="mt-3 flex items-baseline gap-1">
                            <span className="text-[11px] text-masaar-black/60">USD</span>
                            <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-masaar-black">
                              {p.total_usd}
                            </span>
                            <span className="text-[10px] text-masaar-black/50">/ person</span>
                          </div>

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

            {/* STEP 2: APPLICANT DETAILS */}
            {currentStep === 2 && (
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

                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                        Passport Issue Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={applicants[activeApplicantIndex].passportIssueDate}
                        onChange={(e) => updateApplicantField(activeApplicantIndex, "passportIssueDate", e.target.value)}
                        className="mt-1.5 w-full rounded-md border border-black/15 bg-warm-ivory/20 px-3 py-2 text-xs text-masaar-black focus:border-pure-gold focus:outline-none"
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

                    <div className="sm:col-span-3">
                      <label className="block text-xs font-semibold text-masaar-black">
                        Place of Issue <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={applicants[activeApplicantIndex].placeOfIssue}
                        onChange={(e) => updateApplicantField(activeApplicantIndex, "placeOfIssue", e.target.value)}
                        placeholder="e.g. Dubai / New Delhi / London"
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

            {/* STEP 3: DOCUMENT UPLOAD */}
            {currentStep === 3 && (
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
                        key: "travel_details",
                        title: "3. Confirmed Travel Details",
                        desc: "Confirmed flight ticket or itinerary showing arrival and departure.",
                        required: true,
                      },
                      {
                        key: "hotel_booking",
                        title: "4. Hotel Booking Proof",
                        desc: "Confirmed accommodation booking for your stay (optional, recommended).",
                        required: false,
                      },
                      {
                        key: "additional_docs",
                        title: "5. Additional Documents",
                        desc: "Any other supporting documents requested for your nationality (optional).",
                        required: false,
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

            {/* STEP 4: REVIEW & PRICING */}
            {currentStep === 4 && (
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
                    <p className="font-[family-name:var(--font-display)] text-lg font-bold text-masaar-black">
                      USD {selectedProduct?.total_usd} / person
                    </p>
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

            {/* STEP 5: SECURE PAYMENT */}
            {currentStep === 5 && (
              <div className="space-y-6">
                {/* Payment Method */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <h2 className="font-semibold text-masaar-black text-sm">1. Payment Method</h2>
                  <p className="text-[11px] text-masaar-black/60">
                    All transactions are encrypted and processed securely through Stripe.
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card")}
                      className={`flex flex-col items-center justify-center rounded-lg border p-3 text-xs font-semibold transition-all ${
                        paymentMethod === "card"
                          ? "border-pure-gold bg-pure-gold/10 ring-2 ring-pure-gold/20"
                          : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <span>Credit / Debit Card</span>
                      <span className="mt-1 text-[10px] text-masaar-black/60">Visa, Mastercard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("apple_pay")}
                      className={`flex flex-col items-center justify-center rounded-lg border p-3 text-xs font-semibold transition-all ${
                        paymentMethod === "apple_pay"
                          ? "border-pure-gold bg-pure-gold/10 ring-2 ring-pure-gold/20"
                          : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <span>Apple Pay</span>
                      <span className="mt-1 text-[10px] text-masaar-black/60">One-touch checkout</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("google_pay")}
                      className={`flex flex-col items-center justify-center rounded-lg border p-3 text-xs font-semibold transition-all ${
                        paymentMethod === "google_pay"
                          ? "border-pure-gold bg-pure-gold/10 ring-2 ring-pure-gold/20"
                          : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <span>Google Pay</span>
                      <span className="mt-1 text-[10px] text-masaar-black/60">Quick payment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod("bank_transfer")}
                      className={`flex flex-col items-center justify-center rounded-lg border p-3 text-xs font-semibold transition-all ${
                        paymentMethod === "bank_transfer"
                          ? "border-pure-gold bg-pure-gold/10 ring-2 ring-pure-gold/20"
                          : "border-black/10 hover:border-black/30"
                      }`}
                    >
                      <span>Bank Transfer</span>
                      <span className="mt-1 text-[10px] text-masaar-black/60">Direct deposit</span>
                    </button>
                  </div>
                </div>

                {/* Billing Address Option */}
                <div className="rounded-xl border border-black/10 bg-white p-6 shadow-sm">
                  <h2 className="font-semibold text-masaar-black text-sm">2. Billing Address</h2>
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
                  <h2 className="font-semibold text-masaar-black text-sm">3. Confirmation & Terms</h2>

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

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="rounded-md bg-pure-gold px-7 py-3 text-xs font-semibold text-masaar-black shadow-md transition-all hover:bg-light-gold active:scale-95"
                >
                  {currentStep === 4 ? "Continue to Payment →" : "Continue →"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isSubmittingCheckout || !termsAgreed || !discretionAgreed}
                  className="flex items-center gap-2 rounded-md bg-pure-gold px-8 py-3.5 text-xs font-semibold text-masaar-black shadow-lg transition-all hover:bg-light-gold active:scale-95 disabled:opacity-50"
                >
                  {isSubmittingCheckout ? (
                    <span>Connecting to Secure Payment...</span>
                  ) : (
                    <>
                      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Pay USD {totalAmount} Securely →</span>
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
                    src={visaType.hero_image_url || "/trips/destination-image.webp"}
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
                <div className="flex justify-between border-t border-black/10 pt-3 text-sm font-bold text-masaar-black">
                  <span>Total Amount</span>
                  <span className="font-[family-name:var(--font-display)] text-lg text-deep-gold">
                    USD {totalAmount}
                  </span>
                </div>
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
