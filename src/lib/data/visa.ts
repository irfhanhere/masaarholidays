import { createAdminClient } from "@/lib/supabase/admin";
import type {
  VisaProductRow,
  VisaApplicationRow,
  VisaApplicantRow,
  VisaApplicationDocumentRow,
  VisaPaymentRow,
  VisaTypeRow,
} from "@/lib/types/database";

export const CANONICAL_ONLINE_VISA_PRODUCTS: Record<string, VisaProductRow[]> = {
  uae: [
    {
      id: "uae-30-single",
      visa_type_slug: "uae",
      title: "30 Days Single Entry",
      subtitle: "Standard UAE Visit Visa",
      duration: "30 Days",
      entry_type: "Single",
      visa_fee_usd: 90,
      service_fee_usd: 20,
      processing_fee_usd: 10,
      total_usd: 120,
      currency: "USD",
      validity_days: "30 Days",
      processing_time: "3-5 Working Days",
      is_popular: true,
      is_active: true,
      display_order: 1,
      inclusions: ["Single entry", "Valid for 30 days", "Tourism / Visit", "Fast processing"],
      exclusions: ["Flight tickets", "Hotel bookings", "Travel insurance", "Additional authority fees"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "uae-30-multi",
      visa_type_slug: "uae",
      title: "30 Days Multiple Entry",
      subtitle: "Multiple Entry Visit Visa",
      duration: "30 Days",
      entry_type: "Multiple",
      visa_fee_usd: 150,
      service_fee_usd: 25,
      processing_fee_usd: 15,
      total_usd: 190,
      currency: "USD",
      validity_days: "30 Days",
      processing_time: "3-5 Working Days",
      is_popular: false,
      is_active: true,
      display_order: 2,
      inclusions: ["Multiple entry", "Valid for 30 days", "Tourism / Visit", "Fast processing"],
      exclusions: ["Flight tickets", "Hotel bookings", "Travel insurance", "Additional authority fees"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "uae-60-single",
      visa_type_slug: "uae",
      title: "60 Days Single Entry",
      subtitle: "Extended Stay Visit Visa",
      duration: "60 Days",
      entry_type: "Single",
      visa_fee_usd: 120,
      service_fee_usd: 25,
      processing_fee_usd: 15,
      total_usd: 160,
      currency: "USD",
      validity_days: "60 Days",
      processing_time: "3-5 Working Days",
      is_popular: false,
      is_active: true,
      display_order: 3,
      inclusions: ["Single entry", "Valid for 60 days", "Tourism / Visit", "Fast processing"],
      exclusions: ["Flight tickets", "Hotel bookings", "Travel insurance", "Additional authority fees"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "uae-60-multi",
      visa_type_slug: "uae",
      title: "60 Days Multiple Entry",
      subtitle: "Multiple Entry Extended Visa",
      duration: "60 Days",
      entry_type: "Multiple",
      visa_fee_usd: 210,
      service_fee_usd: 30,
      processing_fee_usd: 20,
      total_usd: 260,
      currency: "USD",
      validity_days: "60 Days",
      processing_time: "3-5 Working Days",
      is_popular: false,
      is_active: true,
      display_order: 4,
      inclusions: ["Multiple entry", "Valid for 60 days", "Tourism / Visit", "Fast processing"],
      exclusions: ["Flight tickets", "Hotel bookings", "Travel insurance", "Additional authority fees"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  "saudi-tourist": [
    {
      id: "saudi-30-single",
      visa_type_slug: "saudi-tourist",
      title: "30 Days Single Entry",
      subtitle: "Saudi Tourist e-Visa",
      duration: "30 Days",
      entry_type: "Single",
      visa_fee_usd: 120,
      service_fee_usd: 20,
      processing_fee_usd: 10,
      total_usd: 150,
      currency: "USD",
      validity_days: "30 Days",
      processing_time: "1-3 Working Days",
      is_popular: false,
      is_active: true,
      display_order: 1,
      inclusions: ["Single entry", "Valid for 30 days", "Tourism / Leisure", "Fast digital issue"],
      exclusions: ["Flight tickets", "Hotel bookings", "Separate mandatory medical insurance if applicable"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "saudi-90-multi",
      visa_type_slug: "saudi-tourist",
      title: "90 Days Multiple Entry",
      subtitle: "Multiple Entry Tourist Visa",
      duration: "90 Days",
      entry_type: "Multiple",
      visa_fee_usd: 180,
      service_fee_usd: 25,
      processing_fee_usd: 15,
      total_usd: 220,
      currency: "USD",
      validity_days: "365 Days",
      processing_time: "1-3 Working Days",
      is_popular: true,
      is_active: true,
      display_order: 2,
      inclusions: ["Multiple entry", "Valid for 1 Year", "Up to 90 days stay per visit", "Fast processing"],
      exclusions: ["Flight tickets", "Hotel bookings", "Overstay penalties"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "saudi-transit-96h",
      visa_type_slug: "saudi-tourist",
      title: "Transit Visa (96 Hours)",
      subtitle: "Stopover / Transit Visa",
      duration: "96 Hours",
      entry_type: "Single",
      visa_fee_usd: 80,
      service_fee_usd: 15,
      processing_fee_usd: 10,
      total_usd: 105,
      currency: "USD",
      validity_days: "96 Hours",
      processing_time: "24-48 Hours",
      is_popular: false,
      is_active: true,
      display_order: 3,
      inclusions: ["Single entry", "Valid for 96 hours", "Transit / Short stop", "Quick turnaround"],
      exclusions: ["Connecting flight ticket required"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "saudi-family-visit",
      visa_type_slug: "saudi-tourist",
      title: "Family Visit Visa",
      subtitle: "Family Visit (e-Visa)",
      duration: "90 Days",
      entry_type: "Multiple",
      visa_fee_usd: 200,
      service_fee_usd: 30,
      processing_fee_usd: 20,
      total_usd: 250,
      currency: "USD",
      validity_days: "90 Days",
      processing_time: "3-5 Working Days",
      is_popular: false,
      is_active: true,
      display_order: 4,
      inclusions: ["Family invitation review", "Guidance on MOFA platform", "Document verification"],
      exclusions: ["Flight tickets", "Accommodation"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  us: [
    {
      id: "us-b1-b2",
      visa_type_slug: "us",
      title: "B1/B2 Tourist Visa",
      subtitle: "Business & Tourism",
      duration: "Varies",
      entry_type: "Single / Multi",
      visa_fee_usd: 160,
      service_fee_usd: 25,
      processing_fee_usd: 15,
      total_usd: 200,
      currency: "USD",
      validity_days: "Up to 10 Years",
      processing_time: "Based on embassy appointment",
      is_popular: true,
      is_active: true,
      display_order: 1,
      inclusions: ["DS-160 guidance", "Appointment scheduling", "Document checklist", "Interview preparation"],
      exclusions: ["MRV fee if payable at bank", "Flight booking", "Hotel booking"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "us-student-f1",
      visa_type_slug: "us",
      title: "Student Visa (F1)",
      subtitle: "Study in the United States",
      duration: "Varies",
      entry_type: "Single",
      visa_fee_usd: 185,
      service_fee_usd: 25,
      processing_fee_usd: 15,
      total_usd: 225,
      currency: "USD",
      validity_days: "Course duration",
      processing_time: "Based on embassy appointment",
      is_popular: false,
      is_active: true,
      display_order: 2,
      inclusions: ["I-20 review", "SEVIS guidance", "DS-160 application", "Interview guidance"],
      exclusions: ["SEVIS I-901 fee", "Tuition fees"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "us-business-b1",
      visa_type_slug: "us",
      title: "Business Visa (B1)",
      subtitle: "Business Travel",
      duration: "Varies",
      entry_type: "Single / Multi",
      visa_fee_usd: 160,
      service_fee_usd: 25,
      processing_fee_usd: 15,
      total_usd: 200,
      currency: "USD",
      validity_days: "Up to 10 Years",
      processing_time: "Based on embassy appointment",
      is_popular: false,
      is_active: true,
      display_order: 3,
      inclusions: ["Corporate invitation review", "DS-160 assistance", "Appointment booking", "Interview prep"],
      exclusions: ["Travel tickets", "Conference fees"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: "us-work-h1b",
      visa_type_slug: "us",
      title: "Work Visa (H1B)",
      subtitle: "Specialty Occupation",
      duration: "Varies",
      entry_type: "Single / Multi",
      visa_fee_usd: 205,
      service_fee_usd: 25,
      processing_fee_usd: 15,
      total_usd: 245,
      currency: "USD",
      validity_days: "Petition duration",
      processing_time: "Based on USCIS & embassy",
      is_popular: false,
      is_active: false,
      display_order: 4,
      inclusions: ["I-797 review", "DS-160 filing", "Appointment booking", "Interview support"],
      exclusions: ["USCIS petition fee", "Travel costs"],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
};

/**
 * Fetch online products for a specific visa type (e.g. 'uae', 'saudi-tourist', 'us').
 * Checks Supabase table first, falls back gracefully to canonical catalog.
 */
export async function getPublicVisaProducts(visaSlug: string): Promise<VisaProductRow[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("visa_products")
      .select("*")
      .eq("visa_type_slug", visaSlug)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn(`[visa-data] Error fetching products for ${visaSlug} from DB, using canonical fallback:`, err);
  }

  const fallback = CANONICAL_ONLINE_VISA_PRODUCTS[visaSlug] || [];
  return fallback.filter((p) => p.is_active);
}

/**
 * Fetch a single product by ID.
 */
export async function getVisaProductById(productId: string): Promise<VisaProductRow | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("visa_products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (!error && data) return data;
  } catch {
    // fallback check below
  }

  // Check in canonical catalogs
  for (const list of Object.values(CANONICAL_ONLINE_VISA_PRODUCTS)) {
    const found = list.find((p) => p.id === productId);
    if (found) return found;
  }

  return null;
}

/**
 * Server-side trusted price calculation. Never trusts client-supplied sums.
 * Applies central 5% price reduction rule to customer-facing visa package price.
 */
export function calculateVisaPricing(product: VisaProductRow, applicantCount: number) {
  const count = Math.max(1, applicantCount);
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

/**
 * Fetch application details by tracking token for customer tracking screen.
 */
export async function getVisaApplicationByToken(trackingToken: string): Promise<{
  application: VisaApplicationRow | null;
  applicants: VisaApplicantRow[];
  documents: VisaApplicationDocumentRow[];
  payments: VisaPaymentRow[];
}> {
  try {
    const supabase = createAdminClient();
    const { data: application, error: appErr } = await supabase
      .from("visa_applications")
      .select("*")
      .eq("tracking_token", trackingToken)
      .maybeSingle();

    if (appErr || !application) {
      return { application: null, applicants: [], documents: [], payments: [] };
    }

    const [applicantsRes, docsRes, paymentsRes] = await Promise.all([
      supabase.from("visa_applicants").select("*").eq("application_id", application.id).order("applicant_number", { ascending: true }),
      supabase.from("visa_application_documents").select("*").eq("application_id", application.id),
      supabase.from("visa_payments").select("*").eq("application_id", application.id).order("created_at", { ascending: false }),
    ]);

    return {
      application,
      applicants: applicantsRes.data || [],
      documents: docsRes.data || [],
      payments: paymentsRes.data || [],
    };
  } catch (err) {
    console.error("[visa-data] Error fetching application by token:", err);
    return { application: null, applicants: [], documents: [], payments: [] };
  }
}

/**
 * Fetch application by reference number + optional contact email verification.
 */
export async function getVisaApplicationByRef(referenceNo: string, email?: string): Promise<{
  application: VisaApplicationRow | null;
  applicants: VisaApplicantRow[];
  documents: VisaApplicationDocumentRow[];
  payments: VisaPaymentRow[];
}> {
  try {
    const supabase = createAdminClient();
    let query = supabase.from("visa_applications").select("*").eq("reference_no", referenceNo.trim());

    if (email) {
      query = query.ilike("primary_contact_email", email.trim());
    }

    const { data: application, error: appErr } = await query.maybeSingle();
    if (appErr || !application) {
      return { application: null, applicants: [], documents: [], payments: [] };
    }

    const [applicantsRes, docsRes, paymentsRes] = await Promise.all([
      supabase.from("visa_applicants").select("*").eq("application_id", application.id).order("applicant_number", { ascending: true }),
      supabase.from("visa_application_documents").select("*").eq("application_id", application.id),
      supabase.from("visa_payments").select("*").eq("application_id", application.id).order("created_at", { ascending: false }),
    ]);

    return {
      application,
      applicants: applicantsRes.data || [],
      documents: docsRes.data || [],
      payments: paymentsRes.data || [],
    };
  } catch (err) {
    console.error("[visa-data] Error querying application by ref:", err);
    return { application: null, applicants: [], documents: [], payments: [] };
  }
}
