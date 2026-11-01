import type { VisaProductRow } from "@/lib/types/database";

export interface VisaPricingResult {
  applicantCount: number;
  visaFeePerPerson: number;
  serviceFeePerPerson: number;
  processingFeePerPerson: number;
  originalTotalPerPerson: number;
  discountPerPerson: number;
  discountedTotalPerPerson: number;
  totalPerPerson: number;
  visaFeeTotal: number;
  serviceFeeTotal: number;
  processingFeeTotal: number;
  subtotalAmount: number;
  originalTotalAmount: number;
  discountAmount: number;
  discountPercent: number;
  totalAmount: number;
  currency: string;
}

/**
 * Trusted price calculation for visa products.
 * Saudi Tourist Visa is fixed at approved commercial rate of AED 750 per person (no discount).
 * Other standard visas apply central 5% price reduction rule to customer-facing package price.
 */
export function calculateVisaPricing(
  product: Pick<VisaProductRow, "visa_type_slug" | "currency" | "visa_fee_usd" | "service_fee_usd" | "processing_fee_usd" | "total_usd">,
  applicantCount: number
): VisaPricingResult {
  const count = Math.max(1, applicantCount);

  // Saudi Tourist Visa: Approved fixed price AED 750 per applicant (AED only)
  if (product.visa_type_slug === "saudi-tourist" || product.currency === "AED") {
    const totalPerPerson = 750;
    const totalAmount = totalPerPerson * count;
    return {
      applicantCount: count,
      visaFeePerPerson: 500,
      serviceFeePerPerson: 150,
      processingFeePerPerson: 100,
      originalTotalPerPerson: totalPerPerson,
      discountPerPerson: 0,
      discountedTotalPerPerson: totalPerPerson,
      totalPerPerson: totalPerPerson,
      visaFeeTotal: 500 * count,
      serviceFeeTotal: 150 * count,
      processingFeeTotal: 100 * count,
      subtotalAmount: totalAmount,
      originalTotalAmount: totalAmount,
      discountAmount: 0,
      discountPercent: 0,
      totalAmount,
      currency: "AED",
    };
  }

  const visaFeeTotal = product.visa_fee_usd * count;
  const serviceFeeTotal = product.service_fee_usd * count;
  const processingFeeTotal = product.processing_fee_usd * count;

  const originalSubtotal = visaFeeTotal + serviceFeeTotal + processingFeeTotal;
  const originalTotalPerPerson = product.total_usd;

  // 5% reduction on Visa service package
  const discountRate = 0.05;
  const discountAmount = Math.round(originalSubtotal * discountRate * 100) / 100;
  const totalAmount = Math.round((originalSubtotal - discountAmount) * 100) / 100;

  const discountPerPerson = Math.round(originalTotalPerPerson * discountRate * 100) / 100;
  const discountedTotalPerPerson = Math.round((originalTotalPerPerson - discountPerPerson) * 100) / 100;

  return {
    applicantCount: count,
    visaFeePerPerson: product.visa_fee_usd,
    serviceFeePerPerson: product.service_fee_usd,
    processingFeePerPerson: product.processing_fee_usd,
    originalTotalPerPerson,
    discountPerPerson,
    discountedTotalPerPerson,
    totalPerPerson: discountedTotalPerPerson,
    visaFeeTotal,
    serviceFeeTotal,
    processingFeeTotal,
    subtotalAmount: originalSubtotal,
    originalTotalAmount: originalSubtotal,
    discountAmount,
    discountPercent: 5,
    totalAmount,
    currency: product.currency || "USD",
  };
}
