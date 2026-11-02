import type {
  VisaApplicationRow,
  VisaApplicantRow,
  VisaApplicationDocumentRow,
  VisaPaymentRow,
  VisaApplicationStatus,
  VisaPaymentStatus,
} from "@/lib/types/database";

export interface VisaApplicationWithRelations extends VisaApplicationRow {
  visa_applicants?: VisaApplicantRow[];
  visa_application_documents?: VisaApplicationDocumentRow[];
  visa_payments?: VisaPaymentRow[];
}

export interface VisaApplicationsMetrics {
  total: number;
  paid: number;
  pendingPayment: number;
  incompleteDocs: number;
  readyForProcessing: number;
}

export type DocumentCompletionStatus = "complete" | "incomplete" | "pending_review";

/**
 * Evaluates whether an application has incomplete or rejected documents.
 */
export function evaluateDocumentStatus(
  docs: VisaApplicationDocumentRow[] | undefined,
  applicantCount: number,
  visaSlug: string
): {
  status: DocumentCompletionStatus;
  label: string;
  isComplete: boolean;
  isIncomplete: boolean;
  hasRejected: boolean;
  missingTypes: string[];
} {
  const documents = docs || [];
  const hasRejected = documents.some((d) => d.verification_status === "rejected");

  if (hasRejected) {
    return {
      status: "incomplete",
      label: "Action Required / Rejected",
      isComplete: false,
      isIncomplete: true,
      hasRejected: true,
      missingTypes: ["Rejected document(s) require re-upload"],
    };
  }

  if (documents.length === 0) {
    return {
      status: "incomplete",
      label: "Documents Incomplete",
      isComplete: false,
      isIncomplete: true,
      hasRejected: false,
      missingTypes: ["Passport Copy", "Photograph"],
    };
  }

  // Check essential document presence per applicant count
  const count = Math.max(1, applicantCount || 1);
  const passportDocs = documents.filter((d) =>
    d.document_type.toLowerCase().includes("passport") &&
    !d.document_type.toLowerCase().includes("photo")
  );
  const photoDocs = documents.filter((d) =>
    d.document_type.toLowerCase().includes("photo")
  );

  const missingTypes: string[] = [];
  if (passportDocs.length < count) {
    missingTypes.push(`Passport Copy (${passportDocs.length}/${count})`);
  }
  if (photoDocs.length < count) {
    missingTypes.push(`Photograph (${photoDocs.length}/${count})`);
  }

  const isSaudi = visaSlug === "saudi-tourist";
  if (isSaudi) {
    const eidDocs = documents.filter((d) =>
      d.document_type.toLowerCase().includes("emirates_id") ||
      d.document_type.toLowerCase().includes("residence")
    );
    if (eidDocs.length < count) {
      missingTypes.push(`Emirates ID / Residence Visa (${eidDocs.length}/${count})`);
    }
  }

  if (missingTypes.length > 0) {
    return {
      status: "incomplete",
      label: "Incomplete",
      isComplete: false,
      isIncomplete: true,
      hasRejected: false,
      missingTypes,
    };
  }

  const allVerified = documents.every((d) => d.verification_status === "verified");
  if (allVerified) {
    return {
      status: "complete",
      label: "All Verified",
      isComplete: true,
      isIncomplete: false,
      hasRejected: false,
      missingTypes: [],
    };
  }

  return {
    status: "pending_review",
    label: "Pending Review",
    isComplete: true, // uploaded, awaiting staff review
    isIncomplete: false,
    hasRejected: false,
    missingTypes: [],
  };
}

/**
 * Calculates exact, real database summary metrics from fetched application records.
 */
export function calculateRealMetrics(applications: VisaApplicationWithRelations[]): VisaApplicationsMetrics {
  let paid = 0;
  let pendingPayment = 0;
  let incompleteDocs = 0;
  let readyForProcessing = 0;

  for (const app of applications) {
    const isPaid = app.payment_status === "paid";
    if (isPaid) {
      paid++;
    } else if (app.payment_status === "pending") {
      pendingPayment++;
    }

    const docEval = evaluateDocumentStatus(
      app.visa_application_documents,
      app.applicant_count,
      app.visa_type_slug
    );

    if (docEval.isIncomplete) {
      incompleteDocs++;
    }

    // Ready for processing: paid + documents complete (not incomplete) + awaiting/under processing
    if (
      isPaid &&
      !docEval.isIncomplete &&
      (app.application_status === "submitted" || app.application_status === "under_review")
    ) {
      readyForProcessing++;
    }
  }

  return {
    total: applications.length,
    paid,
    pendingPayment,
    incompleteDocs,
    readyForProcessing,
  };
}
