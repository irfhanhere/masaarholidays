"use client";

import React, { useState, useEffect, useTransition, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  FileText,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  FileQuestion,
  Search,
  Filter,
  Download,
  RotateCcw,
  Eye,
  Edit2,
  X,
  CreditCard,
  User,
  ExternalLink,
  ShieldAlert,
  Calendar,
  FileCheck,
} from "@/components/admin/icons";
import {
  updateVisaApplicationStatus,
  getDocumentSignedUrlAction,
  updateDocumentVerificationStatusAction,
  retryVisaNotificationAction,
  saveInternalNotesAction,
  requestMissingDocumentsAction,
  getApplicationDetailsAction,
  recordVisaRefundAction,
  exportVisaApplicationsCsvAction,
  getDefaultVisaOperationsEmailAction,
  sendVisaDocumentsEmailAction,
} from "./actions";
import type {
  VisaApplicationRow,
  VisaApplicantRow,
  VisaApplicationDocumentRow,
  VisaPaymentRow,
} from "@/lib/types/database";
import type {
  VisaApplicationWithRelations,
  VisaApplicationsMetrics,
} from "./types";
import { evaluateDocumentStatus, calculateRealMetrics } from "./types";

interface VisaApplicationsClientProps {
  dbApplications: VisaApplicationWithRelations[];
  initialMetrics: VisaApplicationsMetrics;
}

export default function VisaApplicationsClient({
  dbApplications,
  initialMetrics,
}: VisaApplicationsClientProps) {
  const [applications, setApplications] = useState<VisaApplicationWithRelations[]>(dbApplications || []);
  const [selectedApp, setSelectedApp] = useState<VisaApplicationWithRelations | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "applicants" | "documents" | "payment" | "activity">("overview");

  // Filter & Search states - DEFAULT TO SUCCESSFULLY PAID APPLICATIONS
  const [filterType, setFilterType] = useState<
    "paid" | "all" | "pending" | "incomplete" | "ready" | "processing" | "completed" | "rejected"
  >("paid");
  const [visaCategoryFilter, setVisaCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  const [isPending, startTransition] = useTransition();

  // Metrics dynamically computed from real application state
  const metrics = useMemo(() => {
    return calculateRealMetrics(applications);
  }, [applications]);

  // Document status evaluations cache
  const docStatusMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof evaluateDocumentStatus>>();
    for (const app of applications) {
      map.set(
        app.id,
        evaluateDocumentStatus(
          app.visa_application_documents,
          app.applicant_count,
          app.visa_type_slug
        )
      );
    }
    return map;
  }, [applications]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      const docEval = docStatusMap.get(app.id) || {
        status: "incomplete",
        label: "Incomplete",
        isComplete: false,
        isIncomplete: true,
        hasRejected: false,
        missingTypes: [],
      };

      // 1. Primary Filter
      if (filterType === "paid" && app.payment_status !== "paid") {
        return false;
      }
      if (filterType === "pending" && app.payment_status !== "pending") {
        return false;
      }
      if (filterType === "incomplete" && !docEval.isIncomplete) {
        return false;
      }
      if (
        filterType === "ready" &&
        (app.payment_status !== "paid" ||
          docEval.isIncomplete ||
          (app.application_status !== "submitted" && app.application_status !== "under_review"))
      ) {
        return false;
      }
      if (
        filterType === "processing" &&
        app.application_status !== "under_review" &&
        app.application_status !== "submitted_to_authorities"
      ) {
        return false;
      }
      if (
        filterType === "completed" &&
        app.application_status !== "approved" &&
        app.application_status !== "delivered"
      ) {
        return false;
      }
      if (
        filterType === "rejected" &&
        app.application_status !== "rejected" &&
        app.payment_status !== "refunded"
      ) {
        return false;
      }

      // 2. Visa Category Filter
      if (visaCategoryFilter !== "all" && app.visa_type_slug !== visaCategoryFilter) {
        return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const refMatch = (app.reference_no || "").toLowerCase().includes(q);
        const nameMatch = (app.primary_contact_name || "").toLowerCase().includes(q);
        const emailMatch = (app.primary_contact_email || "").toLowerCase().includes(q);
        const phoneMatch = (app.primary_contact_phone || "").toLowerCase().includes(q);
        const productMatch = (app.product_title || "").toLowerCase().includes(q);
        const paymentMatch = (app.payment_status || "").toLowerCase().includes(q);
        const docStatusMatch = docEval.label.toLowerCase().includes(q);

        if (
          !refMatch &&
          !nameMatch &&
          !emailMatch &&
          !phoneMatch &&
          !productMatch &&
          !paymentMatch &&
          !docStatusMatch
        ) {
          return false;
        }
      }

      return true;
    });
  }, [applications, filterType, visaCategoryFilter, searchQuery, docStatusMap]);

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / pageSize) || 1;
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage, pageSize]);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, visaCategoryFilter, searchQuery]);

  // Detail Drawer state
  const [appDetails, setAppDetails] = useState<{
    applicants: VisaApplicantRow[];
    documents: VisaApplicationDocumentRow[];
    payments: VisaPaymentRow[];
    timeline: any[];
    auditLogs: any[];
    emailNotifications: any[];
    internalNotes: string;
  } | null>(null);

  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [internalNotesText, setInternalNotesText] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesStatus, setNotesStatus] = useState<string | null>(null);
  const [missingDocsText, setMissingDocsText] = useState<string>("");
  const [isSendingMissingRequest, setIsSendingMissingRequest] = useState<boolean>(false);
  const [missingRequestStatus, setMissingRequestStatus] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

  // Status Change in Detail Drawer
  const handleStatusChange = (appId: string, newStatus: string) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, application_status: newStatus as any } : a))
    );
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, application_status: newStatus as any });
    }
    startTransition(async () => {
      await updateVisaApplicationStatus(appId, newStatus);
    });
  };

  // Load complete application details on drawer open
  useEffect(() => {
    if (!selectedApp) {
      setAppDetails(null);
      setInternalNotesText("");
      setMissingDocsText("");
      setNotesStatus(null);
      setMissingRequestStatus(null);
      return;
    }

    let isMounted = true;
    setIsLoadingDetails(true);

    getApplicationDetailsAction(selectedApp.id).then((res) => {
      if (isMounted && res.success) {
        setAppDetails({
          applicants: (res.applicants as VisaApplicantRow[]) || [],
          documents: (res.documents as VisaApplicationDocumentRow[]) || [],
          payments: (res.payments as VisaPaymentRow[]) || [],
          timeline: res.timeline || [],
          auditLogs: res.auditLogs || [],
          emailNotifications: res.emailNotifications || [],
          internalNotes: res.internal_notes || "",
        });
        setInternalNotesText(res.internal_notes || "");
      }
      if (isMounted) setIsLoadingDetails(false);
    });

    return () => {
      isMounted = false;
    };
  }, [selectedApp]);

  // Save notes
  const handleSaveInternalNotes = async () => {
    if (!selectedApp) return;
    setIsSavingNotes(true);
    setNotesStatus(null);
    try {
      const res = await saveInternalNotesAction(selectedApp.id, internalNotesText);
      if (res.success) {
        setNotesStatus("Internal notes saved successfully.");
      } else {
        setNotesStatus(`Failed to save: ${res.error}`);
      }
    } catch {
      setNotesStatus("Error saving notes.");
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Request missing documents
  const handleSendMissingDocumentsRequest = async () => {
    if (!selectedApp) return;
    if (!missingDocsText.trim()) {
      alert("Please specify the documents or information required from the customer.");
      return;
    }
    setIsSendingMissingRequest(true);
    setMissingRequestStatus(null);
    try {
      const res = await requestMissingDocumentsAction(selectedApp.id, missingDocsText.trim());
      if (res.success) {
        setMissingRequestStatus("Missing document request dispatched to customer & status set to Documents Required.");
        handleStatusChange(selectedApp.id, "documents_required");
      } else {
        setMissingRequestStatus(`Failed: ${res.error}`);
      }
    } catch {
      setMissingRequestStatus("Error sending document request.");
    } finally {
      setIsSendingMissingRequest(false);
    }
  };

  // Document Preview modal state
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    fileName: string;
    mimeType?: string;
    documentType?: string;
    applicantName?: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  const formatDocTypeLabel = (type: string): string => {
    const t = (type || "").toLowerCase();
    if (t.includes("passport") && !t.includes("photo")) return "Passport Copy";
    if (t.includes("residence") || (t.includes("uae") && t.includes("visa"))) return "UAE Residence Visa Copy";
    if (t.includes("emirates_id_front") || (t.includes("emirates") && t.includes("front"))) return "Emirates ID Front";
    if (t.includes("emirates_id_back") || (t.includes("emirates") && t.includes("back"))) return "Emirates ID Back";
    if (t.includes("emirates")) return "Emirates ID Copy";
    if (t.includes("photo")) return "Passport-Size Photograph";
    return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const handleOpenDocPreview = async (doc: VisaApplicationDocumentRow, applicantName?: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await getDocumentSignedUrlAction(doc.file_path, doc.id, selectedApp?.id);
      if (res.success && res.url) {
        setPreviewDoc({
          url: res.url,
          fileName: doc.file_name || "document.pdf",
          mimeType: doc.mime_type || "application/pdf",
          documentType: formatDocTypeLabel(doc.document_type || ""),
          applicantName: applicantName || selectedApp?.primary_contact_name,
        });
      } else {
        alert(res.error || "Failed to generate preview URL.");
      }
    } catch (err: any) {
      alert(err.message || "Preview error");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleDownloadSingleDoc = (docId: string, appId: string) => {
    window.open(
      `/api/admin/visa-documents/download?documentId=${encodeURIComponent(docId)}&applicationId=${encodeURIComponent(appId)}`,
      "_blank"
    );
  };

  const handleDownloadAllZip = (appId: string) => {
    setIsDownloadingZip(true);
    window.location.href = `/api/admin/visa-documents/zip?applicationId=${encodeURIComponent(appId)}`;
    setTimeout(() => setIsDownloadingZip(false), 2500);
  };

  const handleUpdateDocStatus = async (
    docId: string,
    appId: string,
    newStatus: "verified" | "rejected" | "pending"
  ) => {
    let rejectionReason = "";
    if (newStatus === "rejected") {
      const reasonInput = prompt(
        "Enter reason for rejecting this document (e.g. Blurry scan, Expired passport, Cropped edges):",
        "Document scan is blurry. Please provide a clear, full-page color copy."
      );
      if (!reasonInput || !reasonInput.trim()) return;
      rejectionReason = reasonInput.trim();
    }

    const res = await updateDocumentVerificationStatusAction(docId, appId, newStatus, rejectionReason);
    if (!res.success) {
      alert(res.error || "Failed to update document verification status.");
      return;
    }

    // Update local state
    setAppDetails((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === docId
            ? {
                ...d,
                verification_status: newStatus,
                rejection_reason: newStatus === "rejected" ? rejectionReason : null,
              }
            : d
        ),
      };
    });

    setApplications((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        const updatedDocs = (a.visa_application_documents || []).map((d) =>
          d.id === docId
            ? {
                ...d,
                verification_status: newStatus,
                rejection_reason: newStatus === "rejected" ? rejectionReason : null,
              }
            : d
        );
        return { ...a, visa_application_documents: updatedDocs };
      })
    );
  };

  // Record refund
  const handleRecordRefund = async (appId: string, currentAmount: number) => {
    const amountStr = prompt(`Enter refund amount in AED (Max: ${currentAmount}):`, String(currentAmount));
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0 || amount > currentAmount) {
      alert("Invalid refund amount.");
      return;
    }
    const reason = prompt("Enter reason for refund:", "Visa rejected by immigration authorities");
    if (!reason) return;

    try {
      const res = await recordVisaRefundAction(appId, amount, reason);
      if (res.success) {
        alert(`Refund of AED ${amount.toFixed(2)} recorded successfully.`);
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, payment_status: "refunded" } : a))
        );
        if (selectedApp && selectedApp.id === appId) {
          setSelectedApp({ ...selectedApp, payment_status: "refunded" });
        }
      } else {
        alert(res.error || "Failed to process refund.");
      }
    } catch {
      alert("Error recording refund.");
    }
  };

  // CSV Export
  const handleExportCsv = async () => {
    try {
      const res = await exportVisaApplicationsCsvAction();
      if (res.success && res.csv) {
        const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `visa_applications_${new Date().toISOString().split("T")[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(res.error || "Failed to export applications.");
      }
    } catch {
      alert("Failed to export applications CSV.");
    }
  };

  // Phase 6: Email Document Delivery Modal State
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>("");
  const [emailCc, setEmailCc] = useState<string>("");
  const [emailDeliveryMethod, setEmailDeliveryMethod] = useState<"attachment" | "link">("attachment");
  const [selectedDocIdsForEmail, setSelectedDocIdsForEmail] = useState<string[]>([]);
  const [emailStaffNotes, setEmailStaffNotes] = useState<string>("");
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailResult, setEmailResult] = useState<{
    success: boolean;
    recipient?: string;
    deliveryMethod?: "attachment" | "link";
    timestamp?: string;
    messageId?: string;
    error?: string;
  } | null>(null);

  const openEmailModal = async () => {
    if (!selectedApp) return;
    setEmailResult(null);
    setIsEmailModalOpen(true);

    // Default recipient from company config
    try {
      const defaultEmail = await getDefaultVisaOperationsEmailAction();
      setEmailRecipient(defaultEmail || "care@masaarholidays.com");
    } catch {
      setEmailRecipient("care@masaarholidays.com");
    }

    // Default to all documents selected
    const docs = appDetails?.documents || selectedApp.visa_application_documents || [];
    setSelectedDocIdsForEmail(docs.map((d) => d.id));
  };

  const handleToggleDocSelect = (docId: string) => {
    setSelectedDocIdsForEmail((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const handleSelectAllDocs = () => {
    const docs = appDetails?.documents || selectedApp?.visa_application_documents || [];
    setSelectedDocIdsForEmail(docs.map((d) => d.id));
  };

  const handleDeselectAllDocs = () => {
    setSelectedDocIdsForEmail([]);
  };

  const selectedDocsTotalSizeBytes = useMemo(() => {
    const docs = appDetails?.documents || selectedApp?.visa_application_documents || [];
    return docs
      .filter((d) => selectedDocIdsForEmail.includes(d.id))
      .reduce((sum, d) => sum + (d.file_size || 0), 0);
  }, [appDetails, selectedApp, selectedDocIdsForEmail]);

  const selectedDocsTotalSizeMb = selectedDocsTotalSizeBytes / (1024 * 1024);
  const isAttachmentSizeExceeded = emailDeliveryMethod === "attachment" && selectedDocsTotalSizeMb > 15;

  const handleSendDocumentsEmail = async () => {
    if (!selectedApp) return;
    if (!emailRecipient || !emailRecipient.includes("@")) {
      alert("Please provide a valid recipient email address.");
      return;
    }
    if (selectedDocIdsForEmail.length === 0) {
      alert("Please select at least one document to include in the email delivery.");
      return;
    }
    if (isAttachmentSizeExceeded) {
      alert("Total document size exceeds 15 MB. Please switch delivery method to 'Secure download link'.");
      return;
    }

    setIsSendingEmail(true);
    setEmailResult(null);

    try {
      const res = await sendVisaDocumentsEmailAction({
        applicationId: selectedApp.id,
        recipient: emailRecipient,
        cc: emailCc.trim() || undefined,
        deliveryMethod: emailDeliveryMethod,
        selectedDocIds: selectedDocIdsForEmail,
        customNotes: emailStaffNotes.trim() || undefined,
      });

      setEmailResult(res);

      if (res.success) {
        // Refresh detail logs
        getApplicationDetailsAction(selectedApp.id).then((fresh) => {
          if (fresh.success && fresh.auditLogs) {
            setAppDetails((prev) =>
              prev
                ? {
                    ...prev,
                    auditLogs: fresh.auditLogs || [],
                    emailNotifications: fresh.emailNotifications || [],
                  }
                : null
            );
          }
        });
      }
    } catch (err: any) {
      setEmailResult({
        success: false,
        error: err.message || "Failed to dispatch email.",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER & SUMMARY METRICS ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-masaar-black tracking-tight sm:text-2xl font-[family-name:var(--font-display)]">
            Visa Applications
          </h1>
          <p className="mt-0.5 text-xs text-masaar-black/60">
            Manage verified client visa applications, applicant records, private document review, and email delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-md border border-black/15 bg-white px-3 py-2 text-xs font-semibold text-masaar-black shadow-sm transition hover:bg-black/5"
          >
            <Download className="size-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* ── 5 SUMMARY METRIC CARDS (REAL DATABASE COUNTS ONLY) ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {/* 1. Total */}
        <div
          onClick={() => setFilterType("all")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            filterType === "all"
              ? "border-masaar-black bg-white ring-2 ring-masaar-black/10 shadow-sm"
              : "border-black/10 bg-white hover:border-black/25"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-masaar-black/60">Total Applications</span>
            <FileText className="size-4 text-masaar-black/40" />
          </div>
          <p className="mt-2 text-2xl font-bold text-masaar-black">{metrics.total}</p>
          <span className="mt-1 block text-[10px] text-masaar-black/50">All submissions in database</span>
        </div>

        {/* 2. Successfully Paid (DEFAULT VIEW) */}
        <div
          onClick={() => setFilterType("paid")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            filterType === "paid"
              ? "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20 shadow-sm"
              : "border-black/10 bg-white hover:border-emerald-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">Successfully Paid</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">{metrics.paid}</p>
          <span className="mt-1 block text-[10px] font-medium text-emerald-800/70">Verified Gateway Payments (Default)</span>
        </div>

        {/* 3. Pending Payment */}
        <div
          onClick={() => setFilterType("pending")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            filterType === "pending"
              ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-sm"
              : "border-black/10 bg-white hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-800">Pending Payment</span>
            <Clock className="size-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">{metrics.pendingPayment}</p>
          <span className="mt-1 block text-[10px] text-amber-800/70">Awaiting customer checkout</span>
        </div>

        {/* 4. Incomplete Documents */}
        <div
          onClick={() => setFilterType("incomplete")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            filterType === "incomplete"
              ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20 shadow-sm"
              : "border-black/10 bg-white hover:border-rose-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-rose-800">Documents Incomplete</span>
            <FileQuestion className="size-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-700">{metrics.incompleteDocs}</p>
          <span className="mt-1 block text-[10px] text-rose-800/70">Missing or rejected files</span>
        </div>

        {/* 5. Ready for Processing */}
        <div
          onClick={() => setFilterType("ready")}
          className={`cursor-pointer rounded-xl border p-4 transition-all ${
            filterType === "ready"
              ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20 shadow-sm"
              : "border-black/10 bg-white hover:border-blue-500/50"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900">Ready for Processing</span>
            <FileCheck className="size-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-700">{metrics.readyForProcessing}</p>
          <span className="mt-1 block text-[10px] font-medium text-blue-800/70">Paid & verified complete</span>
        </div>
      </div>

      {/* ── FILTER TABS BAR ── */}
      <div className="rounded-xl border border-black/10 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 border-b border-black/5 pb-3">
          {[
            { id: "paid", label: "Paid (Verified)", count: metrics.paid },
            { id: "all", label: "All Applications", count: metrics.total },
            { id: "pending", label: "Pending Payment", count: metrics.pendingPayment },
            { id: "incomplete", label: "Documents Incomplete", count: metrics.incompleteDocs },
            { id: "ready", label: "Ready for Processing", count: metrics.readyForProcessing },
            { id: "processing", label: "Processing" },
            { id: "completed", label: "Completed" },
            { id: "rejected", label: "Rejected / Cancelled" },
          ].map((tab) => {
            const isActive = filterType === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-masaar-black text-white shadow-sm"
                    : "text-masaar-black/70 hover:bg-black/5 hover:text-masaar-black"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive ? "bg-white/20 text-white" : "bg-black/5 text-masaar-black/60"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search & Service Filter */}
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 size-4 text-masaar-black/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, customer name, email, phone..."
              className="w-full rounded-md border border-black/15 bg-warm-ivory/20 pl-9 pr-8 py-2 text-xs text-masaar-black placeholder:text-masaar-black/40 focus:border-masaar-black focus:outline-none focus:ring-1 focus:ring-masaar-black"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2.5 text-xs text-masaar-black/40 hover:text-masaar-black"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-masaar-black/60">Service:</span>
            <select
              value={visaCategoryFilter}
              onChange={(e) => setVisaCategoryFilter(e.target.value)}
              className="rounded-md border border-black/15 bg-white px-2.5 py-1.5 text-xs font-medium text-masaar-black focus:border-masaar-black focus:outline-none"
            >
              <option value="all">All Visa Types</option>
              <option value="uae">UAE Visa</option>
              <option value="saudi-tourist">Saudi Tourist Visa</option>
              <option value="us">US Visa</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── APPLICATIONS TABLE / LIST ── */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-black/10 bg-warm-ivory/40 text-[11px] font-bold uppercase tracking-wider text-masaar-black/70">
              <tr>
                <th className="py-3 px-4">Application Reference</th>
                <th className="py-3 px-4">Customer Contact</th>
                <th className="py-3 px-4">Visa Product</th>
                <th className="py-3 px-3 text-center">Travellers</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-3 text-center">Payment</th>
                <th className="py-3 px-3 text-center">Documents</th>
                <th className="py-3 px-4">Submitted Date</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-masaar-black/50">
                    <p className="font-semibold text-masaar-black text-sm">No applications found</p>
                    <p className="mt-1">
                      {filterType === "paid"
                        ? "There are currently no successfully paid applications in the database. Switch filter to 'All Applications' or 'Pending Payment' to view other records."
                        : "No application records match your current filter and search criteria."}
                    </p>
                    {filterType === "paid" && metrics.pendingPayment > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterType("pending")}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-masaar-black px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-black/80"
                      >
                        View {metrics.pendingPayment} Pending Payment Applications →
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                paginatedApplications.map((app) => {
                  const docEval = docStatusMap.get(app.id) || {
                    status: "incomplete",
                    label: "Incomplete",
                    isComplete: false,
                    isIncomplete: true,
                    hasRejected: false,
                    missingTypes: [],
                  };

                  const isPaid = app.payment_status === "paid";
                  const isRefunded = app.payment_status === "refunded";
                  const dateStr = new Date(app.created_at).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={app.id}
                      className={`transition hover:bg-black/[0.02] ${
                        selectedApp?.id === app.id ? "bg-amber-50/40" : ""
                      }`}
                    >
                      {/* Reference No */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-bold text-masaar-black">
                          {app.reference_no}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-masaar-black">{app.primary_contact_name}</p>
                        <p className="text-[11px] text-masaar-black/50 truncate max-w-[180px]">
                          {app.primary_contact_email}
                        </p>
                      </td>

                      {/* Visa Product */}
                      <td className="py-3 px-4">
                        <p className="font-medium text-masaar-black">{app.product_title}</p>
                        <span className="text-[10px] text-masaar-black/50 uppercase">
                          {app.visa_type_slug}
                        </span>
                      </td>

                      {/* Travellers Count */}
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-masaar-black">
                          {app.applicant_count || 1}
                        </span>
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-masaar-black">
                        {app.currency} {Number(app.total_amount).toFixed(2)}
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800"
                              : isRefunded
                              ? "bg-purple-100 text-purple-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {app.payment_status}
                        </span>
                      </td>

                      {/* Document Completion Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                            docEval.hasRejected
                              ? "bg-red-100 text-red-800"
                              : docEval.isComplete
                              ? "bg-emerald-100 text-emerald-800"
                              : docEval.status === "pending_review"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {docEval.label}
                        </span>
                      </td>

                      {/* Submitted Date */}
                      <td className="py-3 px-4 text-[11px] text-masaar-black/60 whitespace-nowrap">
                        {dateStr}
                      </td>

                      {/* View Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApp(app);
                            setActiveTab("overview");
                          }}
                          className="inline-flex items-center gap-1 rounded border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-masaar-black shadow-sm transition hover:bg-black/5"
                        >
                          <Eye className="size-3" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-col gap-2 border-t border-black/5 bg-warm-ivory/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between text-xs text-masaar-black/60">
          <p>
            Showing{" "}
            <span className="font-semibold text-masaar-black">
              {filteredApplications.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-masaar-black">
              {Math.min(currentPage * pageSize, filteredApplications.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-masaar-black">{filteredApplications.length}</span>{" "}
            applications
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded border border-black/15 bg-white px-2.5 py-1 font-semibold text-masaar-black disabled:opacity-40"
            >
              Previous
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded border border-black/15 bg-white px-2.5 py-1 font-semibold text-masaar-black disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── PHASE 4 & 5: APPLICATION DETAILS DRAWER / MODAL ── */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs">
          <div className="flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Top Modal Header */}
            <div className="flex items-center justify-between border-b border-black/10 bg-admin-ink px-6 py-4 text-white">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-base font-bold text-pure-gold">
                  {selectedApp.reference_no}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    selectedApp.payment_status === "paid"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {selectedApp.payment_status}
                </span>
                <span className="text-xs text-white/60">
                  {selectedApp.primary_contact_name} ({selectedApp.product_title})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Send Documents Action */}
                <button
                  type="button"
                  onClick={openEmailModal}
                  className="inline-flex items-center gap-1.5 rounded bg-pure-gold px-3 py-1.5 text-xs font-bold text-masaar-black shadow hover:bg-light-gold"
                >
                  <Send className="size-3.5" />
                  Send Documents
                </button>

                {/* ZIP Download Action */}
                <button
                  type="button"
                  onClick={() => handleDownloadAllZip(selectedApp.id)}
                  disabled={isDownloadingZip}
                  className="inline-flex items-center gap-1.5 rounded border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50"
                >
                  <Download className="size-3.5" />
                  {isDownloadingZip ? "Building ZIP..." : "Download ZIP"}
                </button>

                {/* Tracking Link */}
                <Link
                  href={`/visa/application/${selectedApp.tracking_token}`}
                  target="_blank"
                  className="rounded border border-white/20 bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
                  title="Open Customer Tracking Page"
                >
                  <ExternalLink className="size-4" />
                </Link>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedApp(null)}
                  className="rounded p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Sub-Nav 5 Sections: Overview, Applicants, Documents, Payment, Activity */}
            <div className="flex border-b border-black/10 bg-warm-ivory/50 px-6">
              {[
                { id: "overview", label: "1. Overview" },
                { id: "applicants", label: `2. Applicants (${appDetails?.applicants?.length || selectedApp.applicant_count || 1})` },
                { id: "documents", label: `3. Documents (${appDetails?.documents?.length || 0})` },
                { id: "payment", label: "4. Payment" },
                { id: "activity", label: `5. Activity (${appDetails?.auditLogs?.length || 0})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`border-b-2 px-4 py-3 text-xs font-bold transition ${
                    activeTab === tab.id
                      ? "border-masaar-black text-masaar-black"
                      : "border-transparent text-masaar-black/50 hover:text-masaar-black"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body / Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 text-xs text-masaar-black">
              {isLoadingDetails ? (
                <div className="flex h-64 items-center justify-center">
                  <div className="size-6 animate-spin rounded-full border-2 border-masaar-black border-t-transparent" />
                  <span className="ml-3 font-medium">Loading full application data...</span>
                </div>
              ) : (
                <>
                  {/* ── SECTION 1: OVERVIEW ── */}
                  {activeTab === "overview" && (
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Customer Contact Details */}
                        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
                          <h3 className="border-b border-black/5 pb-2 text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                            Primary Contact Details
                          </h3>
                          <div className="mt-3 space-y-2">
                            <div>
                              <span className="text-masaar-black/50">Full Name:</span>{" "}
                              <span className="font-semibold">{selectedApp.primary_contact_name}</span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Email:</span>{" "}
                              <span className="font-mono">{selectedApp.primary_contact_email}</span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Phone:</span>{" "}
                              <span className="font-mono">{selectedApp.primary_contact_phone}</span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Nationality:</span>{" "}
                              <span className="font-medium">{selectedApp.nationality}</span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Country of Residence:</span>{" "}
                              <span className="font-medium">{selectedApp.country_of_residence}</span>
                            </div>
                          </div>
                        </div>

                        {/* Application / Service Overview */}
                        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
                          <h3 className="border-b border-black/5 pb-2 text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                            Service & Visa Details
                          </h3>
                          <div className="mt-3 space-y-2">
                            <div>
                              <span className="text-masaar-black/50">Product:</span>{" "}
                              <span className="font-semibold">{selectedApp.product_title}</span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Category:</span>{" "}
                              <span className="font-medium uppercase">{selectedApp.visa_type_slug}</span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Applicant Count:</span>{" "}
                              <span className="font-bold">{selectedApp.applicant_count} Traveller(s)</span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Travel Date:</span>{" "}
                              <span className="font-medium">{selectedApp.travel_date || "Not specified"}</span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Purpose of Visit:</span>{" "}
                              <span className="font-medium">{selectedApp.purpose_of_visit || "Tourism / Visit"}</span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Submission Timestamp:</span>{" "}
                              <span className="font-mono">
                                {new Date(selectedApp.created_at).toLocaleString("en-GB")}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Application Status Controller */}
                      <div className="rounded-xl border border-pure-gold/30 bg-warm-ivory/30 p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-masaar-black/80">
                          Application Processing Status
                        </h3>
                        <p className="mt-1 text-[11px] text-masaar-black/60">
                          Transitioning status triggers verified customer email updates and records timeline milestones.
                        </p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <label className="font-semibold text-xs text-masaar-black">Current Status:</label>
                          <select
                            value={selectedApp.application_status}
                            onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                            className="rounded-md border border-black/20 bg-white px-3 py-1.5 text-xs font-bold text-masaar-black focus:border-masaar-black focus:outline-none"
                          >
                            <option value="draft">Draft / Checkout Incomplete</option>
                            <option value="submitted">Submitted (Under Queue)</option>
                            <option value="under_review">Under Review (Staff Checking Docs)</option>
                            <option value="documents_required">Documents Required (Action Needed)</option>
                            <option value="submitted_to_authorities">Submitted to Authorities</option>
                            <option value="approved">Approved</option>
                            <option value="rejected">Rejected</option>
                            <option value="delivered">Delivered (e-Visa Issued)</option>
                          </select>
                        </div>
                      </div>

                      {/* Internal Staff Notes */}
                      <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                          Internal Notes (Confidential Staff Use Only)
                        </h3>
                        <p className="mt-0.5 text-[11px] text-masaar-black/50">
                          These notes are strictly private and never exposed to customers.
                        </p>
                        <textarea
                          rows={3}
                          value={internalNotesText}
                          onChange={(e) => setInternalNotesText(e.target.value)}
                          placeholder="Add internal notes regarding sponsor, file number, or authority requirements..."
                          className="mt-3 w-full rounded-md border border-black/15 p-2.5 text-xs text-masaar-black focus:border-masaar-black focus:outline-none"
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleSaveInternalNotes}
                            disabled={isSavingNotes}
                            className="rounded bg-masaar-black px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-black/80 disabled:opacity-50"
                          >
                            {isSavingNotes ? "Saving..." : "Save Notes"}
                          </button>
                          {notesStatus && (
                            <span className="text-xs font-medium text-emerald-700">{notesStatus}</span>
                          )}
                        </div>
                      </div>

                      {/* Request Missing Documents Tool */}
                      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                          Request Additional / Missing Documents From Customer
                        </h3>
                        <p className="mt-0.5 text-[11px] text-amber-800/80">
                          Dispatches an official document request notification with the customer tracking link.
                        </p>
                        <textarea
                          rows={2}
                          value={missingDocsText}
                          onChange={(e) => setMissingDocsText(e.target.value)}
                          placeholder="e.g. Please upload clear color copy of UAE Residence Visa showing at least 3 months validity..."
                          className="mt-3 w-full rounded-md border border-amber-300 bg-white p-2.5 text-xs text-masaar-black focus:border-amber-600 focus:outline-none"
                        />
                        <div className="mt-2 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={handleSendMissingDocumentsRequest}
                            disabled={isSendingMissingRequest}
                            className="rounded bg-amber-700 px-4 py-1.5 text-xs font-semibold text-white shadow hover:bg-amber-800 disabled:opacity-50"
                          >
                            {isSendingMissingRequest ? "Sending Request..." : "Request Documents via Email"}
                          </button>
                          {missingRequestStatus && (
                            <span className="text-xs font-medium text-amber-900">
                              {missingRequestStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── SECTION 2: APPLICANTS ── */}
                  {activeTab === "applicants" && (
                    <div className="space-y-4">
                      {appDetails?.applicants && appDetails.applicants.length > 0 ? (
                        appDetails.applicants.map((applicant, idx) => (
                          <div
                            key={applicant.id || idx}
                            className="rounded-xl border border-black/10 bg-white p-5 shadow-xs"
                          >
                            <div className="flex items-center justify-between border-b border-black/5 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="flex size-7 items-center justify-center rounded-full bg-pure-gold/20 font-bold text-deep-gold">
                                  #{applicant.applicant_number || idx + 1}
                                </span>
                                <h3 className="text-sm font-bold text-masaar-black">{applicant.full_name}</h3>
                              </div>
                              <span className="rounded bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-masaar-black/60">
                                {applicant.nationality}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                              <div>
                                <span className="block text-masaar-black/50 text-[10px] uppercase">
                                  Date of Birth
                                </span>
                                <span className="font-semibold">{applicant.date_of_birth}</span>
                              </div>
                              <div>
                                <span className="block text-masaar-black/50 text-[10px] uppercase">Gender</span>
                                <span className="font-semibold">{applicant.gender}</span>
                              </div>
                              <div>
                                <span className="block text-masaar-black/50 text-[10px] uppercase">
                                  Country of Residence
                                </span>
                                <span className="font-semibold">{applicant.country_of_residence}</span>
                              </div>
                              <div>
                                <span className="block text-masaar-black/50 text-[10px] uppercase">
                                  Passport Number
                                </span>
                                <span className="font-mono font-bold text-masaar-black">
                                  {applicant.passport_number}
                                </span>
                              </div>
                              <div>
                                <span className="block text-masaar-black/50 text-[10px] uppercase">
                                  Passport Issue Date
                                </span>
                                <span className="font-medium">{applicant.passport_issue_date || "N/A"}</span>
                              </div>
                              <div>
                                <span className="block text-masaar-black/50 text-[10px] uppercase">
                                  Passport Expiry Date
                                </span>
                                <span className="font-semibold text-masaar-black">
                                  {applicant.passport_expiry_date}
                                </span>
                              </div>
                              <div>
                                <span className="block text-masaar-black/50 text-[10px] uppercase">
                                  Place of Issue
                                </span>
                                <span className="font-medium">{applicant.place_of_issue || "N/A"}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-xl border border-dashed border-black/15 p-8 text-center text-xs text-masaar-black/60">
                          <p className="font-semibold text-masaar-black">Primary Applicant</p>
                          <p className="mt-1">{selectedApp.primary_contact_name}</p>
                          <p className="text-[11px] text-masaar-black/50">
                            (Detailed multi-traveller records were not submitted separately for this booking)
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── SECTION 3: DOCUMENTS MANAGER (PHASE 5) ── */}
                  {activeTab === "documents" && (
                    <div className="space-y-6">
                      {/* Top Action Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/10 bg-warm-ivory/30 p-4">
                        <div>
                          <h3 className="font-bold text-masaar-black text-xs uppercase tracking-wider">
                            Document Management
                          </h3>
                          <p className="text-[11px] text-masaar-black/60">
                            Private Supabase storage (private_documents bucket). Preview, verify, reject, or bundle.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadAllZip(selectedApp.id)}
                            disabled={isDownloadingZip || (appDetails?.documents.length || 0) === 0}
                            className="inline-flex items-center gap-1.5 rounded bg-masaar-black px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-black/80 disabled:opacity-40"
                          >
                            <Download className="size-3.5" />
                            {isDownloadingZip ? "Generating..." : "Download All as ZIP"}
                          </button>
                          <button
                            type="button"
                            onClick={openEmailModal}
                            disabled={(appDetails?.documents.length || 0) === 0}
                            className="inline-flex items-center gap-1.5 rounded bg-pure-gold px-3 py-1.5 text-xs font-bold text-masaar-black shadow hover:bg-light-gold disabled:opacity-40"
                          >
                            <Send className="size-3.5" />
                            Email to Company
                          </button>
                        </div>
                      </div>

                      {/* Documents Grouped by Applicant */}
                      {appDetails?.documents && appDetails.documents.length > 0 ? (
                        <div className="space-y-4">
                          {/* Group documents by applicant */}
                          {Array.from(
                            new Set(appDetails.documents.map((d) => d.applicant_id || "general"))
                          ).map((groupApplicantId) => {
                            const groupApplicant = appDetails.applicants.find(
                              (a) => a.id === groupApplicantId
                            );
                            const groupDocs = appDetails.documents.filter(
                              (d) => (d.applicant_id || "general") === groupApplicantId
                            );

                            return (
                              <div
                                key={groupApplicantId}
                                className="rounded-xl border border-black/10 bg-white p-5 shadow-xs"
                              >
                                <div className="border-b border-black/5 pb-2">
                                  <h4 className="font-bold text-masaar-black text-xs">
                                    {groupApplicant
                                      ? `Applicant #${groupApplicant.applicant_number}: ${groupApplicant.full_name}`
                                      : `General Documents / ${selectedApp.primary_contact_name}`}
                                  </h4>
                                </div>

                                <div className="mt-3 divide-y divide-black/5">
                                  {groupDocs.map((doc) => {
                                    const isVerified = doc.verification_status === "verified";
                                    const isRejected = doc.verification_status === "rejected";

                                    return (
                                      <div
                                        key={doc.id}
                                        className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                                      >
                                        <div className="flex items-start gap-3">
                                          <span
                                            className={`flex size-9 shrink-0 items-center justify-center rounded text-sm ${
                                              isVerified
                                                ? "bg-emerald-100 text-emerald-800"
                                                : isRejected
                                                ? "bg-red-100 text-red-800"
                                                : "bg-black/5 text-masaar-black"
                                            }`}
                                          >
                                            📄
                                          </span>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-semibold text-masaar-black">
                                                {formatDocTypeLabel(doc.document_type)}
                                              </span>
                                              <span
                                                className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                                                  isVerified
                                                    ? "bg-emerald-100 text-emerald-800"
                                                    : isRejected
                                                    ? "bg-red-100 text-red-800"
                                                    : "bg-amber-100 text-amber-800"
                                                }`}
                                              >
                                                {doc.verification_status}
                                              </span>
                                            </div>
                                            <p className="mt-0.5 font-mono text-[11px] text-masaar-black/50 truncate max-w-sm">
                                              {doc.file_name} · {(doc.file_size / 1024).toFixed(0)} KB ·{" "}
                                              {new Date(doc.created_at).toLocaleDateString("en-GB")}
                                            </p>
                                            {isRejected && doc.rejection_reason && (
                                              <p className="mt-1 text-[11px] text-red-700 font-medium">
                                                Rejection Note: {doc.rejection_reason}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Action buttons for document */}
                                        <div className="flex items-center gap-1.5 self-start sm:self-center">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleOpenDocPreview(
                                                doc,
                                                groupApplicant?.full_name || selectedApp.primary_contact_name
                                              )
                                            }
                                            disabled={isLoadingPreview}
                                            className="rounded border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-masaar-black shadow-xs hover:bg-black/5"
                                          >
                                            Preview
                                          </button>

                                          <button
                                            type="button"
                                            onClick={() => handleDownloadSingleDoc(doc.id, selectedApp.id)}
                                            className="rounded border border-black/15 bg-white px-2.5 py-1 text-xs font-semibold text-masaar-black shadow-xs hover:bg-black/5"
                                          >
                                            Download
                                          </button>

                                          {!isVerified && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleUpdateDocStatus(doc.id, selectedApp.id, "verified")
                                              }
                                              className="rounded bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xs hover:bg-emerald-800"
                                            >
                                              Verify
                                            </button>
                                          )}

                                          {!isRejected && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleUpdateDocStatus(doc.id, selectedApp.id, "rejected")
                                              }
                                              className="rounded border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 shadow-xs hover:bg-red-100"
                                            >
                                              Reject
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-black/15 p-12 text-center text-xs text-masaar-black/50">
                          <p className="font-bold text-masaar-black text-sm">No documents uploaded</p>
                          <p className="mt-1">
                            The customer has not yet uploaded identity documents for this application.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── SECTION 4: PAYMENT ── */}
                  {activeTab === "payment" && (
                    <div className="space-y-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        {/* Gateway Details */}
                        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
                          <h3 className="border-b border-black/5 pb-2 text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                            Verified Payment Summary
                          </h3>
                          <div className="mt-3 space-y-2">
                            <div>
                              <span className="text-masaar-black/50">Payment Status:</span>{" "}
                              <span
                                className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  selectedApp.payment_status === "paid"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {selectedApp.payment_status}
                              </span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Payment Gateway:</span>{" "}
                              <span className="font-bold uppercase text-masaar-black">
                                {selectedApp.payment_gateway || "Stripe"}
                              </span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Payment Method:</span>{" "}
                              <span className="font-semibold text-masaar-black">
                                {selectedApp.payment_method || "Card Payment"}
                              </span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Charged Amount:</span>{" "}
                              <span className="font-mono text-sm font-bold text-deep-gold">
                                {selectedApp.currency} {Number(selectedApp.total_amount).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-masaar-black/50">Transaction / Gateway Reference:</span>{" "}
                              <span className="font-mono text-[11px] break-all">
                                {selectedApp.stripe_payment_intent_id ||
                                  selectedApp.tabby_payment_id ||
                                  selectedApp.stripe_session_id ||
                                  "Recorded on checkout"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Refund Management Card */}
                        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
                          <h3 className="border-b border-black/5 pb-2 text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                            Refund Management
                          </h3>
                          <p className="mt-2 text-[11px] text-masaar-black/60">
                            Issue gateway refunds or record manual refunds with mandatory audit trail reason.
                          </p>
                          {selectedApp.payment_status === "paid" ? (
                            <div className="mt-4">
                              <button
                                type="button"
                                onClick={() =>
                                  handleRecordRefund(selectedApp.id, selectedApp.total_amount)
                                }
                                className="rounded bg-rose-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-rose-800"
                              >
                                Process Refund
                              </button>
                            </div>
                          ) : (
                            <p className="mt-4 font-semibold text-xs text-masaar-black/60">
                              Payment status is currently {selectedApp.payment_status}. Refund action unavailable.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Payment Ledger Entries */}
                      <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
                        <h3 className="border-b border-black/5 pb-2 text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                          Payment Ledger Records (public.visa_payments)
                        </h3>
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-warm-ivory/50 text-[10px] font-bold uppercase text-masaar-black/60">
                              <tr>
                                <th className="p-2">Transaction Ref</th>
                                <th className="p-2">Gateway</th>
                                <th className="p-2">Amount</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Date</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5">
                              {appDetails?.payments && appDetails.payments.length > 0 ? (
                                appDetails.payments.map((p) => (
                                  <tr key={p.id}>
                                    <td className="p-2 font-mono text-[11px]">{p.transaction_reference}</td>
                                    <td className="p-2 uppercase">{p.gateway}</td>
                                    <td className="p-2 font-semibold">
                                      {p.currency} {p.amount}
                                    </td>
                                    <td className="p-2">
                                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-800">
                                        {p.payment_status}
                                      </span>
                                    </td>
                                    <td className="p-2 text-masaar-black/60">
                                      {new Date(p.created_at).toLocaleString("en-GB")}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center text-masaar-black/40">
                                    No ledger entries recorded in visa_payments yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── SECTION 5: ACTIVITY (AUDIT & EMAIL LOGS) ── */}
                  {activeTab === "activity" && (
                    <div className="space-y-6">
                      {/* Timeline */}
                      <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
                        <h3 className="border-b border-black/5 pb-2 text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                          Milestone Timeline
                        </h3>
                        <div className="mt-4 space-y-3">
                          {appDetails?.timeline && appDetails.timeline.length > 0 ? (
                            appDetails.timeline.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-3">
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                                  ✓
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-masaar-black">
                                      {typeof step.step === "string" ? step.step.replace(/_/g, " ").toUpperCase() : "UPDATE"}
                                    </span>
                                    <span className="text-[10px] text-masaar-black/50">
                                      {step.timestamp ? new Date(step.timestamp).toLocaleString("en-GB") : ""}
                                    </span>
                                  </div>
                                  {step.note && <p className="text-[11px] text-masaar-black/70 mt-0.5">{step.note}</p>}
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-masaar-black/50">No timeline events recorded.</p>
                          )}
                        </div>
                      </div>

                      {/* Administrative Audit Logs */}
                      <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
                        <h3 className="border-b border-black/5 pb-2 text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                          Administrative Audit Trail (public.admin_audit_logs)
                        </h3>
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-warm-ivory/50 text-[10px] font-bold uppercase text-masaar-black/60">
                              <tr>
                                <th className="p-2">Action</th>
                                <th className="p-2">Admin Email</th>
                                <th className="p-2">Timestamp</th>
                                <th className="p-2">Details</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 font-mono text-[11px]">
                              {appDetails?.auditLogs && appDetails.auditLogs.length > 0 ? (
                                appDetails.auditLogs.map((log) => (
                                  <tr key={log.id}>
                                    <td className="p-2 font-bold text-masaar-black">{log.action}</td>
                                    <td className="p-2 text-masaar-black/70">{log.admin_email}</td>
                                    <td className="p-2 text-masaar-black/50">
                                      {new Date(log.created_at).toLocaleString("en-GB")}
                                    </td>
                                    <td className="p-2 text-masaar-black/60 truncate max-w-xs">
                                      {JSON.stringify(log.details)}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="p-4 text-center text-masaar-black/40 font-sans">
                                    No administrative audit logs for this application yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Email Notifications Dispatched */}
                      <div className="rounded-xl border border-black/10 bg-white p-5 shadow-xs">
                        <h3 className="border-b border-black/5 pb-2 text-xs font-bold uppercase tracking-wider text-masaar-black/70">
                          Email Notifications History (public.email_notifications)
                        </h3>
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-warm-ivory/50 text-[10px] font-bold uppercase text-masaar-black/60">
                              <tr>
                                <th className="p-2">Recipient</th>
                                <th className="p-2">Template</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Sent At</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 text-[11px]">
                              {appDetails?.emailNotifications && appDetails.emailNotifications.length > 0 ? (
                                appDetails.emailNotifications.map((notif) => (
                                  <tr key={notif.id}>
                                    <td className="p-2 font-semibold text-masaar-black">{notif.recipient}</td>
                                    <td className="p-2 text-masaar-black/70">{notif.template_type}</td>
                                    <td className="p-2">
                                      <span
                                        className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                                          notif.status === "sent"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : "bg-red-100 text-red-800"
                                        }`}
                                      >
                                        {notif.status}
                                      </span>
                                    </td>
                                    <td className="p-2 text-masaar-black/60">
                                      {notif.sent_at ? new Date(notif.sent_at).toLocaleString("en-GB") : "Pending"}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={4} className="p-4 text-center text-masaar-black/40">
                                    No email notifications recorded yet.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE 6: SEND DOCUMENTS EMAIL MODAL ── */}
      {isEmailModalOpen && selectedApp && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/10 bg-masaar-black px-6 py-4 text-white">
              <div>
                <h3 className="font-bold text-sm text-pure-gold">Send Application Documents</h3>
                <p className="text-[11px] text-white/60">
                  Application: {selectedApp.reference_no} · {selectedApp.primary_contact_name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="rounded p-1 text-white/60 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-masaar-black">
              {emailResult ? (
                /* Delivery Confirmation View */
                <div
                  className={`rounded-xl border p-6 text-center ${
                    emailResult.success
                      ? "border-emerald-300 bg-emerald-50 text-emerald-950"
                      : "border-red-300 bg-red-50 text-red-950"
                  }`}
                >
                  <span className="text-3xl">{emailResult.success ? "✅" : "❌"}</span>
                  <h4 className="mt-2 text-base font-bold">
                    {emailResult.success ? "Email Dispatched Successfully" : "Email Delivery Failed"}
                  </h4>
                  <p className="mt-1 text-xs text-masaar-black/70">
                    {emailResult.success
                      ? "The email provider has confirmed acceptance and message queueing."
                      : emailResult.error || "Failed to deliver documents by email."}
                  </p>

                  <div className="mt-4 inline-block text-left rounded-lg bg-white/70 p-3 text-[11px] space-y-1 font-mono">
                    <p>
                      <strong>Recipient:</strong> {emailResult.recipient}
                    </p>
                    <p>
                      <strong>Method:</strong> {emailResult.deliveryMethod}
                    </p>
                    <p>
                      <strong>Timestamp:</strong> {emailResult.timestamp}
                    </p>
                    {emailResult.messageId && (
                      <p>
                        <strong>Provider Message ID:</strong> {emailResult.messageId}
                      </p>
                    )}
                  </div>

                  <div className="mt-5">
                    <button
                      type="button"
                      onClick={() => setIsEmailModalOpen(false)}
                      className="rounded bg-masaar-black px-5 py-2 font-semibold text-white hover:bg-black/80"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Email Configuration Form */
                <>
                  {/* Recipient Field */}
                  <div>
                    <label className="block font-bold text-xs text-masaar-black">
                      Recipient Email (Company Processing Mailbox):
                    </label>
                    <input
                      type="email"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                      placeholder="e.g. care@masaarholidays.com"
                      className="mt-1 w-full rounded-md border border-black/20 p-2 text-xs text-masaar-black focus:border-masaar-black focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-masaar-black/50">
                      Defaults to the company's configured visa processing email address.
                    </p>
                  </div>

                  {/* Optional CC Field */}
                  <div>
                    <label className="block font-bold text-xs text-masaar-black">
                      Optional CC (Comma-separated):
                    </label>
                    <input
                      type="text"
                      value={emailCc}
                      onChange={(e) => setEmailCc(e.target.value)}
                      placeholder="e.g. ops@masaarholidays.com, supervisor@masaarholidays.com"
                      className="mt-1 w-full rounded-md border border-black/20 p-2 text-xs text-masaar-black focus:border-masaar-black focus:outline-none"
                    />
                  </div>

                  {/* Delivery Method Selection */}
                  <div className="rounded-lg border border-black/10 bg-warm-ivory/20 p-4">
                    <label className="block font-bold text-xs text-masaar-black mb-2">
                      Choose Delivery Method:
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="attachment"
                          checked={emailDeliveryMethod === "attachment"}
                          onChange={() => setEmailDeliveryMethod("attachment")}
                          className="mt-0.5 text-masaar-black focus:ring-masaar-black"
                        />
                        <div>
                          <p className="font-bold text-masaar-black">Option A: Direct ZIP Attachment</p>
                          <p className="text-[11px] text-masaar-black/60">
                            Compiles selected files into an archive attached directly to the email.
                            (Subject to standard SMTP attachment size limits — max 15 MB).
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="deliveryMethod"
                          value="link"
                          checked={emailDeliveryMethod === "link"}
                          onChange={() => setEmailDeliveryMethod("link")}
                          className="mt-0.5 text-masaar-black focus:ring-masaar-black"
                        />
                        <div>
                          <p className="font-bold text-masaar-black">Option B: Secure Download Link</p>
                          <p className="text-[11px] text-masaar-black/60">
                            Generates an encrypted, time-limited link (valid for 48 hours). The recipient
                            downloads the ZIP directly with zero attachment size restrictions.
                          </p>
                        </div>
                      </label>
                    </div>

                    {isAttachmentSizeExceeded && (
                      <div className="mt-3 rounded border border-rose-300 bg-rose-50 p-3 text-[11px] text-rose-900">
                        <strong>⚠️ Attachment Limit Exceeded:</strong> Total selected documents (
                        {selectedDocsTotalSizeMb.toFixed(1)} MB) exceed the 15 MB email limit.
                        Please switch to <strong>Secure download link</strong> delivery.
                      </div>
                    )}
                  </div>

                  {/* Document Selection Checklist */}
                  <div>
                    <div className="flex items-center justify-between border-b border-black/10 pb-1 mb-2">
                      <label className="font-bold text-xs text-masaar-black">
                        Select Documents to Send ({selectedDocIdsForEmail.length}/
                        {(appDetails?.documents || selectedApp.visa_application_documents || []).length}):
                      </label>
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={handleSelectAllDocs}
                          className="font-semibold text-deep-gold hover:underline"
                        >
                          Select All
                        </button>
                        <span>·</span>
                        <button
                          type="button"
                          onClick={handleDeselectAllDocs}
                          className="text-masaar-black/60 hover:underline"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-md border border-black/10 p-2 bg-white">
                      {(appDetails?.documents || selectedApp.visa_application_documents || []).map((doc) => {
                        const isChecked = selectedDocIdsForEmail.includes(doc.id);
                        return (
                          <label
                            key={doc.id}
                            className={`flex items-center justify-between rounded p-2 text-xs transition cursor-pointer ${
                              isChecked ? "bg-amber-50/50" : "hover:bg-black/5"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleDocSelect(doc.id)}
                                className="rounded text-masaar-black focus:ring-masaar-black"
                              />
                              <span className="font-semibold">{formatDocTypeLabel(doc.document_type)}</span>
                              <span className="font-mono text-[10px] text-masaar-black/50">
                                ({doc.file_name})
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-masaar-black/60">
                              {((doc.file_size || 0) / 1024).toFixed(0)} KB
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Staff Notes */}
                  <div>
                    <label className="block font-bold text-xs text-masaar-black">
                      Optional Staff Note (Included in Email):
                    </label>
                    <textarea
                      rows={2}
                      value={emailStaffNotes}
                      onChange={(e) => setEmailStaffNotes(e.target.value)}
                      placeholder="e.g. Verified files attached. Please expedite authority filing before 3 PM..."
                      className="mt-1 w-full rounded-md border border-black/20 p-2 text-xs text-masaar-black focus:border-masaar-black focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            {!emailResult && (
              <div className="flex items-center justify-end gap-2 border-t border-black/10 bg-warm-ivory/20 px-6 py-3">
                <button
                  type="button"
                  onClick={() => setIsEmailModalOpen(false)}
                  className="rounded border border-black/15 bg-white px-4 py-2 text-xs font-semibold text-masaar-black hover:bg-black/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendDocumentsEmail}
                  disabled={isSendingEmail || selectedDocIdsForEmail.length === 0 || isAttachmentSizeExceeded}
                  className="inline-flex items-center gap-2 rounded bg-pure-gold px-5 py-2 text-xs font-bold text-masaar-black shadow hover:bg-light-gold disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <>
                      <span className="size-3 animate-spin rounded-full border border-masaar-black border-t-transparent" />
                      Dispatching Email...
                    </>
                  ) : (
                    <>
                      <Send className="size-3.5" />
                      Send Documents Email
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── DOCUMENT PREVIEW MODAL ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-black/10 bg-masaar-black px-6 py-3.5 text-white">
              <div>
                <h4 className="font-bold text-sm text-pure-gold">{previewDoc.documentType}</h4>
                <p className="text-[11px] text-white/60">
                  {previewDoc.applicantName} · {previewDoc.fileName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download={previewDoc.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20"
                >
                  <Download className="size-3.5" />
                  Direct Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded p-1 text-white/60 hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* Content Display */}
            <div className="flex-1 overflow-auto bg-neutral-900 p-4 flex items-center justify-center">
              {previewDoc.mimeType?.includes("image") ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.fileName}
                  className="max-h-full max-w-full rounded object-contain shadow-lg"
                />
              ) : (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.fileName}
                  className="h-full w-full rounded border-0 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
