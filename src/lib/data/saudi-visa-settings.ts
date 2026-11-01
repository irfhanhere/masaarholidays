export interface SaudiVisaSettings {
  basePrice: number;
  familyDiscountPercentage: number;
  familyMinimumApplicants: number;
  currency: string;
  processingEstimate: string;
  whatsappNumber: string;
  approvedNationalities: string[];
  validityRequirements: {
    passportMinMonths: number;
    residenceMinMonths: number;
    emiratesIdMinMonths: number;
  };
  allowUnknownNationalitiesManualReview: boolean;
}

export const DEFAULT_SAUDI_VISA_SETTINGS: SaudiVisaSettings = {
  basePrice: 750,
  familyDiscountPercentage: 5,
  familyMinimumApplicants: 3,
  currency: "AED",
  processingEstimate: "Approximately 2 Working Days",
  whatsappNumber: "+971 55 732 9320",
  approvedNationalities: ["India", "Pakistan"],
  validityRequirements: {
    passportMinMonths: 6,
    residenceMinMonths: 3,
    emiratesIdMinMonths: 3,
  },
  allowUnknownNationalitiesManualReview: true,
};

export interface PricingBreakdown {
  applicationType: "individual" | "family";
  applicantCount: number;
  pricePerApplicant: number;
  originalTotal: number;
  subtotal: number;
  familyDiscountPercentage: number;
  familyDiscountAmount: number;
  discountAmount: number;
  finalPayableAmount: number;
  currency: string;
  isFamilyDiscountApplied: boolean;
}

/**
 * Pure, reliable calculation for Saudi Tourist Visa applications.
 * - Individual: AED 750 per applicant.
 * - Family: 5% discount per applicant when 3 or more applicants apply together.
 */
export function calculateSaudiVisaPricing(
  applicantCount: number,
  applicationType: "individual" | "family" = "individual",
  settings: Partial<SaudiVisaSettings> = {}
): PricingBreakdown {
  const basePrice = settings.basePrice ?? DEFAULT_SAUDI_VISA_SETTINGS.basePrice;
  const discountPct = settings.familyDiscountPercentage ?? DEFAULT_SAUDI_VISA_SETTINGS.familyDiscountPercentage;
  const minFamily = settings.familyMinimumApplicants ?? DEFAULT_SAUDI_VISA_SETTINGS.familyMinimumApplicants;
  const currency = settings.currency ?? DEFAULT_SAUDI_VISA_SETTINGS.currency;

  const count = Math.max(1, Math.floor(applicantCount));
  const isFamily = applicationType === "family" && count >= minFamily;
  const originalTotal = basePrice * count;

  let familyDiscountAmount = 0;
  let finalPayableAmount = originalTotal;

  if (isFamily) {
    familyDiscountAmount = Math.round(originalTotal * (discountPct / 100) * 100) / 100;
    finalPayableAmount = Math.round((originalTotal - familyDiscountAmount) * 100) / 100;
  }

  return {
    applicationType,
    applicantCount: count,
    pricePerApplicant: basePrice,
    originalTotal,
    subtotal: originalTotal,
    familyDiscountPercentage: isFamily ? discountPct : 0,
    familyDiscountAmount,
    discountAmount: familyDiscountAmount,
    finalPayableAmount,
    currency,
    isFamilyDiscountApplied: isFamily,
  };
}

/**
 * Validates if a nationality is on the approved list.
 */
export function isNationalityApproved(
  nationality: string,
  approvedList: string[] = DEFAULT_SAUDI_VISA_SETTINGS.approvedNationalities
): boolean {
  if (!nationality) return false;
  const clean = nationality.trim().toLowerCase();
  return approvedList.some((n) => n.trim().toLowerCase() === clean);
}

export interface ApplicantValidationInput {
  fullName?: string;
  nationality?: string;
  passportNumber?: string;
  passportExpiryDate?: string;
  residenceExpiryDate?: string;
  emiratesIdExpiryDate?: string;
  emiratesIdNumber?: string;
}

export interface ApplicantValidationResult {
  eligible: boolean;
  manualReviewRequired: boolean;
  issues: string[];
}

/**
 * Independently validates an individual applicant's eligibility and validity periods.
 * Distinguishes UAE residence permit validity from Emirates ID validity.
 */
export function validateApplicantEligibility(
  applicant: ApplicantValidationInput,
  settings: SaudiVisaSettings = DEFAULT_SAUDI_VISA_SETTINGS,
  referenceDate: Date = new Date()
): ApplicantValidationResult {
  const issues: string[] = [];
  let manualReviewRequired = false;

  const nationality = (applicant.nationality || "").trim();
  if (!nationality) {
    issues.push("Passport nationality is required.");
  } else if (!isNationalityApproved(nationality, settings.approvedNationalities)) {
    if (settings.allowUnknownNationalitiesManualReview) {
      manualReviewRequired = true;
    } else {
      issues.push(`Nationality (${nationality}) is not on the pre-approved list.`);
    }
  }

  if (applicant.passportExpiryDate) {
    const pExp = new Date(applicant.passportExpiryDate);
    const minPassDate = new Date(referenceDate);
    minPassDate.setMonth(minPassDate.getMonth() + settings.validityRequirements.passportMinMonths);
    if (pExp < minPassDate) {
      issues.push(
        `Passport must be valid for at least ${settings.validityRequirements.passportMinMonths} months from today.`
      );
    }
  }

  if (applicant.residenceExpiryDate) {
    const rExp = new Date(applicant.residenceExpiryDate);
    const minResDate = new Date(referenceDate);
    minResDate.setMonth(minResDate.getMonth() + settings.validityRequirements.residenceMinMonths);
    if (rExp < minResDate) {
      issues.push(
        `UAE Residence Permit must have at least ${settings.validityRequirements.residenceMinMonths} months remaining validity.`
      );
    }
  }

  if (applicant.emiratesIdExpiryDate) {
    const eExp = new Date(applicant.emiratesIdExpiryDate);
    const minEidDate = new Date(referenceDate);
    minEidDate.setMonth(minEidDate.getMonth() + settings.validityRequirements.emiratesIdMinMonths);
    if (eExp < minEidDate) {
      issues.push(
        `Emirates ID must have at least ${settings.validityRequirements.emiratesIdMinMonths} months remaining validity.`
      );
    }
  }

  return {
    eligible: issues.length === 0,
    manualReviewRequired,
    issues,
  };
}

/**
 * Generates WhatsApp click-to-chat links with approved dynamic prefilled messages.
 */
export function getSaudiVisaWhatsAppLink(
  type: "individual" | "family" | "general" = "general",
  applicantCount: number = 3,
  phoneNumber: string = "971557329320"
): string {
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, "");

  let text = "";
  if (type === "individual") {
    text =
      "Hello Masaar Holidays, I am interested in the 1-Year Multiple-Entry Saudi Tourist Visa. Please share the eligibility requirements and application details. I am interested in the AED 750 individual application.";
  } else if (type === "family") {
    text = `Hello Masaar Holidays, I am interested in the 1-Year Multiple-Entry Saudi Tourist Visa family offer. We are planning to apply for ${applicantCount} applicants and would like to receive details about the 5% family discount.`;
  } else {
    text =
      "Hello Masaar Holidays, I would like to speak with a visa specialist regarding the 1-Year Multiple-Entry Saudi Tourist Visa.";
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const SAUDI_VISA_FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "What is the 1-Year Multiple-Entry Saudi Tourist Visa?",
    answer:
      "The Saudi Tourist Visa is a digital visa issued by the Kingdom of Saudi Arabia that permits multiple entries over a 1-year validity period. Travellers can stay up to 90 days per visit for tourism, leisure, visiting family or friends, and performing Umrah.",
  },
  {
    id: "faq-2",
    question: "Who can apply for this visa service?",
    answer:
      "This service is curated specifically for UAE residents holding eligible foreign passports (primarily Indian and Pakistani nationals) who hold a valid UAE residence visa and valid Emirates ID. Applicants of other approved nationalities may also apply subject to eligibility verification.",
  },
  {
    id: "faq-3",
    question: "Can Indian passport holders apply?",
    answer:
      "Yes. Indian passport holders who are legal UAE residents with at least 3 months remaining on their UAE residence permit and at least 6 months validity on their Indian passport are eligible to apply through Masaar Holidays.",
  },
  {
    id: "faq-4",
    question: "Can Pakistani passport holders apply?",
    answer:
      "Yes. Pakistani passport holders who reside in the UAE with a valid UAE residence visa (minimum 3 months validity) and a passport valid for at least 6 months can apply directly through our online flow.",
  },
  {
    id: "faq-5",
    question: "Can other nationalities apply?",
    answer:
      "Nationalities outside our pre-approved list require manual eligibility verification. If your nationality is not listed, our system will prompt you to speak with our visa specialist team on WhatsApp, who will verify your specific documentation and eligibility requirements before proceeding.",
  },
  {
    id: "faq-6",
    question: "Can I perform Umrah using this visa?",
    answer:
      "Yes. The Saudi 1-Year Multiple-Entry Tourist Visa permits the holder to perform Umrah throughout its validity, outside the restricted official Hajj season, subject to current Saudi Ministry of Hajj and Umrah regulations and official permit booking via the Nusuk platform.",
  },
  {
    id: "faq-7",
    question: "Is this visa valid for Hajj?",
    answer:
      "No. This visa strictly does not authorise Hajj pilgrimage. Performing Hajj requires a dedicated, official Hajj visa issued specifically through official government-authorised Hajj quotas and platforms.",
  },
  {
    id: "faq-8",
    question: "How long does processing take?",
    answer:
      "Processing typically takes approximately 2 working days once all required documents, verified applicant details, and secure online payment are submitted. Timelines are subject to Saudi immigration authority review.",
  },
  {
    id: "faq-9",
    question: "What documents are required?",
    answer:
      "Only three simple documents are initially required per applicant: 1) Clear color copy of passport bio page (min. 6 months validity), 2) Recent passport-size photograph with white background, and 3) Clear copy of valid Emirates ID (front & back, min. 3 months validity).",
  },
  {
    id: "faq-10",
    question: "What is the individual application price?",
    answer:
      "The individual application price is a flat rate of AED 750 per applicant. This fee includes visa processing, digital document handling, and support from Masaar's team.",
  },
  {
    id: "faq-11",
    question: "How does the 5% family discount work?",
    answer:
      "When 3 or more applicants apply together in a single application, a 5% discount is automatically applied to each applicant's service fee. For example, 3 applicants pay AED 2,137.50 instead of AED 2,250 (saving AED 112.50); 4 applicants pay AED 2,850 instead of AED 3,000 (saving AED 150).",
  },
  {
    id: "faq-12",
    question: "How many applicants qualify for the family discount?",
    answer:
      "A minimum of 3 applicants in the same application is required to activate the family discount. There is no upper limit; each additional eligible applicant in the family group receives the 5% discount.",
  },
  {
    id: "faq-13",
    question: "Does every family member need to meet eligibility requirements?",
    answer:
      "Yes. Each family member must independently meet the passport and UAE residency validity requirements and provide their individual documents (passport copy, photo, and Emirates ID).",
  },
  {
    id: "faq-14",
    question: "What happens if my application is rejected?",
    answer:
      "Masaar Holidays offers a transparent refund assurance policy if your visa application is rejected by the authorities, subject to our published refund terms. Please review our refund terms before payment.",
  },
  {
    id: "faq-15",
    question: "How do I receive my visa?",
    answer:
      "Once approved by the Saudi authorities, your electronic visa PDF is delivered directly to your registered email address and WhatsApp number, and becomes available for instant download in your Masaar online tracking portal.",
  },
  {
    id: "faq-16",
    question: "Can I enquire through WhatsApp instead of applying online?",
    answer:
      "Absolutely. You can click any 'Enquire on WhatsApp' button on this page to speak directly with our visa support specialists, ask questions, or request personalised guidance for your journey.",
  },
];
