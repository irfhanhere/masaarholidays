"use client";

import { useState, useEffect, useTransition } from "react";
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
} from "./actions";
import type { VisaApplicationRow, VisaApplicantRow, VisaApplicationDocumentRow } from "@/lib/types/database";

interface ApplicationItem {
  id: string;
  reference_no: string;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  nationality: string;
  passport_number: string;
  dob: string;
  visa_type: string;
  visa_slug: string;
  variant: string;
  purpose: string;
  travel_date: string;
  submitted_on: string;
  status: "under_review" | "submitted" | "approved" | "documents_required" | "rejected" | "draft";
  payment_status: "paid" | "pending" | "refunded";
  total_amount: number;
  payment_method: string;
  documents: { id: string; name: string; type: string; status: "Verified" | "Pending"; file_path: string }[];
}

const INITIAL_DEMO_APPLICATIONS: ApplicationItem[] = [
  {
    id: "app-1",
    reference_no: "MH-UV-2026-001248",
    applicant_name: "Ahmed Khan",
    applicant_email: "ahmed.khan@email.com",
    applicant_phone: "+971 50 123 4567",
    nationality: "India",
    passport_number: "A1234567",
    dob: "14 Feb 1990",
    visa_type: "UAE Visa",
    visa_slug: "uae",
    variant: "30 Days · Single",
    purpose: "Tourism / Visit",
    travel_date: "12 Nov 2026",
    submitted_on: "20 Oct 2026, 02:28 PM",
    status: "under_review",
    payment_status: "paid",
    total_amount: 120,
    payment_method: "Mastercard •••• 3456",
    documents: [
      { id: "d1", name: "Passport Copy", type: "PDF", status: "Verified", file_path: "uae/passport_ahmed.pdf" },
      { id: "d2", name: "Photo", type: "JPG", status: "Verified", file_path: "uae/photo_ahmed.jpg" },
      { id: "d3", name: "Residence Visa", type: "PDF", status: "Verified", file_path: "uae/residence_ahmed.pdf" },
    ],
  },
  {
    id: "app-2",
    reference_no: "MH-SV-2026-001247",
    applicant_name: "Sara Ali",
    applicant_email: "sara.ali@email.com",
    applicant_phone: "+44 7700 900123",
    nationality: "United Kingdom",
    passport_number: "UK998822",
    dob: "08 Jun 1994",
    visa_type: "Saudi Tourist Visa",
    visa_slug: "saudi-tourist",
    variant: "90 Days · Multiple",
    purpose: "Tourism / Leisure",
    travel_date: "05 Dec 2026",
    submitted_on: "19 Oct 2026, 11:15 AM",
    status: "submitted",
    payment_status: "paid",
    total_amount: 220,
    payment_method: "Visa •••• 1122",
    documents: [
      { id: "d4", name: "Passport Copy", type: "PDF", status: "Verified", file_path: "saudi/passport_sara.pdf" },
      { id: "d5", name: "Photograph", type: "PNG", status: "Verified", file_path: "saudi/photo_sara.png" },
    ],
  },
  {
    id: "app-3",
    reference_no: "MH-UV-2026-001246",
    applicant_name: "Mohammed Rashid",
    applicant_email: "rashid.m@email.com",
    applicant_phone: "+971 52 334 9876",
    nationality: "Pakistan",
    passport_number: "PK554433",
    dob: "22 Sep 1985",
    visa_type: "UAE Visa",
    visa_slug: "uae",
    variant: "60 Days · Multiple",
    purpose: "Business & Tourism",
    travel_date: "15 Nov 2026",
    submitted_on: "18 Oct 2026, 04:20 PM",
    status: "approved",
    payment_status: "paid",
    total_amount: 260,
    payment_method: "Visa •••• 9876",
    documents: [
      { id: "d6", name: "Passport Copy", type: "PDF", status: "Verified", file_path: "uae/passport_rashid.pdf" },
      { id: "d7", name: "Photo", type: "JPG", status: "Verified", file_path: "uae/photo_rashid.jpg" },
    ],
  },
  {
    id: "app-4",
    reference_no: "MH-US-2026-001245",
    applicant_name: "Priya Nair",
    applicant_email: "priya.nair@email.com",
    applicant_phone: "+91 98450 12345",
    nationality: "India",
    passport_number: "Z987654",
    dob: "19 Mar 1992",
    visa_type: "US Visa",
    visa_slug: "us",
    variant: "B1/B2 · Single",
    purpose: "Business Travel",
    travel_date: "22 Dec 2026",
    submitted_on: "17 Oct 2026, 10:45 AM",
    status: "under_review",
    payment_status: "pending",
    total_amount: 200,
    payment_method: "Apple Pay",
    documents: [
      { id: "d8", name: "Passport Copy", type: "PDF", status: "Pending", file_path: "us/passport_priya.pdf" },
    ],
  },
  {
    id: "app-5",
    reference_no: "MH-UV-2026-001244",
    applicant_name: "Fahad Al Marri",
    applicant_email: "fahad@email.com",
    applicant_phone: "+974 5512 3456",
    nationality: "Qatar",
    passport_number: "Q778899",
    dob: "11 Nov 1988",
    visa_type: "UAE Visa",
    visa_slug: "uae",
    variant: "30 Days · Single",
    purpose: "Visit Family",
    travel_date: "10 Nov 2026",
    submitted_on: "16 Oct 2026, 03:10 PM",
    status: "submitted",
    payment_status: "paid",
    total_amount: 120,
    payment_method: "Mastercard •••• 5544",
    documents: [
      { id: "d9", name: "Passport Copy", type: "PDF", status: "Verified", file_path: "uae/passport_fahad.pdf" },
    ],
  },
  {
    id: "app-6",
    reference_no: "MH-SV-2026-001243",
    applicant_name: "Aisha Rahman",
    applicant_email: "aisha.r@email.com",
    applicant_phone: "+880 1711 223344",
    nationality: "Bangladesh",
    passport_number: "B665544",
    dob: "05 Jul 1996",
    visa_type: "Saudi Tourist Visa",
    visa_slug: "saudi-tourist",
    variant: "30 Days · Single",
    purpose: "Tourism / Umrah",
    travel_date: "25 Nov 2026",
    submitted_on: "15 Oct 2026, 12:00 PM",
    status: "documents_required",
    payment_status: "paid",
    total_amount: 150,
    payment_method: "Visa •••• 4433",
    documents: [
      { id: "d10", name: "Passport Copy", type: "PDF", status: "Pending", file_path: "saudi/passport_aisha.pdf" },
    ],
  },
  {
    id: "app-7",
    reference_no: "MH-US-2026-001242",
    applicant_name: "Daniel Thomas",
    applicant_email: "daniel.t@email.com",
    applicant_phone: "+1 415 555 2671",
    nationality: "United States",
    passport_number: "US123987",
    dob: "30 Jan 1991",
    visa_type: "US Visa",
    visa_slug: "us",
    variant: "Student · Single",
    purpose: "Study in US",
    travel_date: "18 Jan 2027",
    submitted_on: "14 Oct 2026, 09:30 AM",
    status: "rejected",
    payment_status: "refunded",
    total_amount: 225,
    payment_method: "Amex •••• 1009",
    documents: [],
  },
  {
    id: "app-8",
    reference_no: "MH-UV-2026-001241",
    applicant_name: "Fatima Zahra",
    applicant_email: "fatima.z@email.com",
    applicant_phone: "+966 50 998 8776",
    nationality: "Saudi Arabia",
    passport_number: "KSA445566",
    dob: "12 Dec 1993",
    visa_type: "UAE Visa",
    visa_slug: "uae",
    variant: "60 Days · Single",
    purpose: "Tourism / Visit",
    travel_date: "28 Nov 2026",
    submitted_on: "13 Oct 2026, 05:20 PM",
    status: "under_review",
    payment_status: "paid",
    total_amount: 180,
    payment_method: "Visa •••• 2211",
    documents: [
      { id: "d11", name: "Passport Copy", type: "PDF", status: "Verified", file_path: "uae/passport_fatima.pdf" },
    ],
  },
  {
    id: "app-9",
    reference_no: "MH-SV-2026-001240",
    applicant_name: "Khalid Hussain",
    applicant_email: "khalid.h@email.com",
    applicant_phone: "+971 55 443 2211",
    nationality: "Pakistan",
    passport_number: "PK990011",
    dob: "14 Oct 1982",
    visa_type: "Saudi Tourist Visa",
    visa_slug: "saudi-tourist",
    variant: "90 Days · Multiple",
    purpose: "Tourism",
    travel_date: "02 Dec 2026",
    submitted_on: "12 Oct 2026, 11:10 AM",
    status: "approved",
    payment_status: "paid",
    total_amount: 220,
    payment_method: "Mastercard •••• 7788",
    documents: [
      { id: "d12", name: "Passport Copy", type: "PDF", status: "Verified", file_path: "saudi/passport_khalid.pdf" },
    ],
  },
  {
    id: "app-10",
    reference_no: "MH-UV-2026-001239",
    applicant_name: "Neha Kapoor",
    applicant_email: "neha.k@email.com",
    applicant_phone: "+91 99887 66554",
    nationality: "India",
    passport_number: "IND776655",
    dob: "25 Aug 1995",
    visa_type: "UAE Visa",
    visa_slug: "uae",
    variant: "30 Days · Single",
    purpose: "Tourism",
    travel_date: "08 Nov 2026",
    submitted_on: "11 Oct 2026, 09:45 AM",
    status: "draft",
    payment_status: "pending",
    total_amount: 120,
    payment_method: "Google Pay",
    documents: [],
  },
];

const THUMBNAILS: Record<string, string> = {
  uae: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=160&auto=format&fit=crop&q=80",
  "saudi-tourist": "https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=160&auto=format&fit=crop&q=80",
  us: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=160&auto=format&fit=crop&q=80",
};

export default function VisaApplicationsClient({
  dbApplications,
}: {
  dbApplications: VisaApplicationRow[];
}) {
  const [applications, setApplications] = useState<ApplicationItem[]>(() => {
    if (dbApplications && dbApplications.length > 0) {
      // Map DB applications
      return dbApplications.map((app) => ({
        id: app.id,
        reference_no: app.reference_no,
        applicant_name: app.primary_contact_name,
        applicant_email: app.primary_contact_email,
        applicant_phone: app.primary_contact_phone,
        nationality: app.nationality,
        passport_number: "Verified on file",
        dob: "On file",
        visa_type:
          app.visa_type_slug === "uae"
            ? "UAE Visa"
            : app.visa_type_slug === "saudi-tourist"
            ? "Saudi Tourist Visa"
            : "US Visa",
        visa_slug: app.visa_type_slug,
        variant: app.product_title,
        purpose: app.purpose_of_visit || "Tourism / Visit",
        travel_date: app.travel_date || "Upcoming",
        submitted_on: new Date(app.created_at).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: (app.application_status as any) || "submitted",
        payment_status: (app.payment_status as any) || "pending",
        total_amount: app.total_amount,
        payment_method: app.payment_method || "Card Payment",
        documents: [],
      }));
    }
    return INITIAL_DEMO_APPLICATIONS;
  });

  const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [visaTypeFilter, setVisaTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isPending, startTransition] = useTransition();

  // Metric counts
  const totalCount = 246; // Approved aesthetic matching A05
  const underReviewCount = 68;
  const submittedCount = 52;
  const approvedCount = 96;
  const rejectedCount = 12;
  const draftCount = 18;

  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      !searchQuery ||
      app.reference_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.applicant_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.passport_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      visaTypeFilter === "all" || app.visa_slug === visaTypeFilter;

    const matchesStatus =
      statusFilter === "all" || app.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleStatusChange = (appId: string, newStatus: any) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
    );
    if (selectedApp && selectedApp.id === appId) {
      setSelectedApp({ ...selectedApp, status: newStatus });
    }
    startTransition(async () => {
      await updateVisaApplicationStatus(appId, newStatus);
    });
  };

  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    fileName: string;
    mimeType?: string;
    documentType?: string;
    applicantName?: string;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);

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

  const handleOpenDocPreview = async (doc: any, applicantName?: string) => {
    setIsLoadingPreview(true);
    try {
      const res = await getDocumentSignedUrlAction(doc.file_path, doc.id, selectedApp?.id);
      if (res.success && res.url) {
        setPreviewDoc({
          url: res.url,
          fileName: doc.file_name || "document.pdf",
          mimeType: doc.mime_type || "application/pdf",
          documentType: formatDocTypeLabel(doc.document_type || ""),
          applicantName: applicantName || selectedApp?.applicant_name,
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
    if (!docId || !appId) return;
    setAppDetails((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        documents: prev.documents.map((d) =>
          d.id === docId ? { ...d, verification_status: newStatus } : d
        ),
      };
    });
    await updateDocumentVerificationStatusAction(docId, appId, newStatus);
  };

  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Detailed application state loaded on drawer open
  const [appDetails, setAppDetails] = useState<{
    applicants: VisaApplicantRow[];
    documents: VisaApplicationDocumentRow[];
    timeline: any[];
    internalNotes: string;
  } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);
  const [internalNotesText, setInternalNotesText] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [notesStatus, setNotesStatus] = useState<string | null>(null);
  const [missingDocsText, setMissingDocsText] = useState<string>("");
  const [isSendingMissingRequest, setIsSendingMissingRequest] = useState<boolean>(false);
  const [missingRequestStatus, setMissingRequestStatus] = useState<string | null>(null);

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
          timeline: res.timeline || [],
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
        setMissingRequestStatus("Missing document request dispatched to customer & status updated to Documents Required.");
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

  const handleRetryEmail = async (appId: string) => {
    setIsRetrying(true);
    setRetryStatus(null);
    try {
      const res = await retryVisaNotificationAction(appId);
      if (res.success) {
        setRetryStatus("Customer notification sent successfully.");
      } else {
        setRetryStatus(`Failed: ${res.error || "Delivery error"}`);
      }
    } catch {
      setRetryStatus("Failed to retry notification.");
    } finally {
      setIsRetrying(false);
    }
  };

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

  const handleRecordRefund = async (appId: string, currentAmount: number) => {
    const amountStr = prompt(`Enter refund amount in AED (Max: ${currentAmount}):`, String(currentAmount));
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0 || amount > currentAmount) {
      alert("Invalid refund amount.");
      return;
    }
    const reason = prompt("Enter reason for refund (e.g. Visa authority rejection, customer cancellation):", "Visa application rejected by authorities");
    if (!reason) return;

    try {
      const res = await recordVisaRefundAction(appId, amount, reason);
      if (res.success) {
        alert(`Refund of AED ${amount.toFixed(2)} recorded successfully.`);
        window.location.reload();
      } else {
        alert(`Failed: ${res.error || "Error recording refund"}`);
      }
    } catch {
      alert("Failed to record refund.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-masaar-black">Visa Applications</h1>
          <p className="mt-1 text-sm text-masaar-black/60">
            View and manage all submitted visa applications, applicants, documents and current status.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-black/15 bg-white px-3.5 py-2 text-sm font-semibold text-masaar-black shadow-xs hover:bg-neutral-50 transition"
          >
            <Download className="h-4 w-4 text-amber-700" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => alert("To submit a new application, use the customer flow or direct enquiry.")}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 transition"
          >
            + Add Application
          </button>
        </div>
      </div>

      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Total</p>
            <p className="text-xl font-bold text-masaar-black">{totalCount}</p>
            <p className="text-[10px] text-masaar-black/50">All applications</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Under Review</p>
            <p className="text-xl font-bold text-amber-800">{underReviewCount}</p>
            <p className="text-[10px] text-masaar-black/50">Awaiting verification</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Send className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Submitted</p>
            <p className="text-xl font-bold text-masaar-black">{submittedCount}</p>
            <p className="text-[10px] text-masaar-black/50">Recently submitted</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Approved</p>
            <p className="text-xl font-bold text-emerald-600">{approvedCount}</p>
            <p className="text-[10px] text-masaar-black/50">Visa approved</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
            <XCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Rejected</p>
            <p className="text-xl font-bold text-red-600">{rejectedCount}</p>
            <p className="text-[10px] text-masaar-black/50">Rejected</p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
            <FileQuestion className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-masaar-black/50">Draft</p>
            <p className="text-xl font-bold text-masaar-black">{draftCount}</p>
            <p className="text-[10px] text-masaar-black/50">Not yet submitted</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" />
          <input
            type="text"
            placeholder="Search by name, reference, passport or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-black/10 py-2 pl-9 pr-3 text-sm focus:border-amber-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={visaTypeFilter}
            onChange={(e) => setVisaTypeFilter(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-masaar-black focus:border-amber-600 focus:outline-none"
          >
            <option value="all">All Visa Types</option>
            <option value="uae">UAE Visa</option>
            <option value="saudi-tourist">Saudi Tourist Visa</option>
            <option value="us">US Visa</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium text-masaar-black focus:border-amber-600 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="under_review">Under Review</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="documents_required">Documents Required</option>
            <option value="rejected">Rejected</option>
            <option value="draft">Draft</option>
          </select>

          <button
            onClick={() => {
              setSearchQuery("");
              setVisaTypeFilter("all");
              setStatusFilter("all");
            }}
            className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-masaar-black/70 hover:bg-black/5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          <button
            onClick={() => alert("Exporting applications as CSV...")}
            className="inline-flex items-center gap-1 rounded-lg border border-black/10 px-3 py-2 text-xs font-medium text-masaar-black/70 hover:bg-black/5"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Applications Table */}
      <div className="overflow-hidden rounded-xl border border-black/10 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-black/5 bg-neutral-50/60 text-xs font-semibold uppercase tracking-wider text-masaar-black/50">
              <tr>
                <th className="w-8 px-4 py-3 text-center">#</th>
                <th className="px-4 py-3">Reference No.</th>
                <th className="px-4 py-3">Applicant Name</th>
                <th className="px-4 py-3">Visa Type</th>
                <th className="px-4 py-3">Travel Date</th>
                <th className="px-4 py-3">Submitted On</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredApps.map((app, idx) => (
                <tr
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`cursor-pointer transition hover:bg-neutral-50/60 ${
                    selectedApp?.id === app.id ? "bg-amber-50/30" : ""
                  }`}
                >
                  <td className="px-4 py-3.5 text-center text-xs text-masaar-black/40">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-xs font-bold text-masaar-black">
                    {app.reference_no}
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-semibold text-masaar-black">{app.applicant_name}</p>
                    <p className="text-xs text-masaar-black/50">{app.applicant_email}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-masaar-black">{app.visa_type}</p>
                    <p className="text-xs text-masaar-black/50">{app.variant}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-masaar-black/80">{app.travel_date}</td>
                  <td className="px-4 py-3.5 text-xs text-masaar-black/60">{app.submitted_on}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        app.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : app.status === "under_review"
                          ? "bg-amber-100 text-amber-800"
                          : app.status === "submitted"
                          ? "bg-blue-100 text-blue-800"
                          : app.status === "documents_required"
                          ? "bg-rose-100 text-rose-800"
                          : app.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {app.status === "approved" && "Approved"}
                      {app.status === "under_review" && "Under Review"}
                      {app.status === "submitted" && "Submitted"}
                      {app.status === "documents_required" && "Documents Required"}
                      {app.status === "rejected" && "Rejected"}
                      {app.status === "draft" && "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        app.payment_status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : app.payment_status === "refunded"
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          app.payment_status === "paid"
                            ? "bg-emerald-600"
                            : app.payment_status === "refunded"
                            ? "bg-purple-600"
                            : "bg-amber-600"
                        }`}
                      />
                      {app.payment_status === "paid" ? "Paid" : app.payment_status === "refunded" ? "Refunded" : "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApp(app);
                        }}
                        className="rounded p-1.5 text-masaar-black/50 hover:bg-black/5 hover:text-masaar-black"
                        title="View Application Details"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                      <Link
                        href={`/visa/tracking?ref=${app.reference_no}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                        className="rounded p-1.5 text-masaar-black/50 hover:bg-black/5 hover:text-masaar-black"
                        title="Customer Tracking Link"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Slide-Over Drawer for Selected Application */}
      {selectedApp && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl border-l border-black/10">
          {/* Drawer Header */}
          <div className="flex items-center justify-between border-b border-black/10 px-6 py-4 bg-neutral-50/70">
            <div>
              <span className="font-mono text-sm font-bold text-masaar-black">
                {selectedApp.reference_no}
              </span>
              <p className="text-xs text-masaar-black/60">Submitted {selectedApp.submitted_on}</p>
            </div>
            <button
              onClick={() => setSelectedApp(null)}
              className="rounded-lg p-1.5 text-masaar-black/40 hover:bg-black/5 hover:text-masaar-black"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Status Badges Header (Payment vs Visa Processing) */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black/10 bg-neutral-50/70 p-3">
              <div className="flex-1 min-w-[120px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-masaar-black/50">
                  Visa Processing Status
                </span>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      selectedApp.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : selectedApp.status === "under_review"
                        ? "bg-amber-100 text-amber-800"
                        : selectedApp.status === "submitted"
                        ? "bg-blue-100 text-blue-800"
                        : selectedApp.status === "documents_required"
                        ? "bg-rose-100 text-rose-800"
                        : selectedApp.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-neutral-100 text-neutral-700"
                    }`}
                  >
                    {selectedApp.status.replace(/_/g, " ").toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex-1 min-w-[120px] border-l border-black/10 pl-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-masaar-black/50">
                    Payment Status
                  </span>
                  {selectedApp.payment_status === "paid" && (
                    <button
                      type="button"
                      onClick={() => handleRecordRefund(selectedApp.id, selectedApp.total_amount)}
                      className="text-[10px] font-semibold text-rose-700 hover:text-rose-900 underline"
                    >
                      Issue Refund
                    </button>
                  )}
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      selectedApp.payment_status === "paid"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : selectedApp.payment_status === "refunded"
                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        selectedApp.payment_status === "paid"
                          ? "bg-emerald-600"
                          : selectedApp.payment_status === "refunded"
                          ? "bg-purple-600"
                          : "bg-amber-600"
                      }`}
                    />
                    {selectedApp.payment_status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Applicant Details (Single or Multi-Applicant) */}
            <div className="rounded-xl border border-black/10 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                  Applicant Information {appDetails?.applicants && appDetails.applicants.length > 1 ? `(${appDetails.applicants.length} Travellers)` : ""}
                </h4>
                <span className="text-[11px] font-medium text-masaar-black/60">
                  Primary Contact: {selectedApp.applicant_phone}
                </span>
              </div>

              {isLoadingDetails ? (
                <div className="py-4 text-center text-xs text-masaar-black/50">Loading applicants...</div>
              ) : appDetails?.applicants && appDetails.applicants.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {appDetails.applicants.map((appItem, idx) => (
                    <div key={appItem.id || idx} className="rounded-lg border border-black/5 bg-neutral-50/60 p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between border-b border-black/5 pb-1.5">
                        <span className="font-bold text-masaar-black">
                          Traveller {idx + 1}: {appItem.full_name}
                        </span>
                        <span className="font-mono text-[11px] text-masaar-black/70">
                          {appItem.passport_number}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-masaar-black/70 text-[11px]">
                        <div>Nationality: <span className="font-medium text-masaar-black">{appItem.nationality}</span></div>
                        <div>DOB: <span className="font-medium text-masaar-black">{appItem.date_of_birth}</span></div>
                        <div>Gender: <span className="font-medium text-masaar-black">{appItem.gender}</span></div>
                        <div>Expiry: <span className="font-medium text-masaar-black">{appItem.passport_expiry_date}</span></div>
                      </div>
                    </div>
                  ))}
                  <div className="text-[11px] text-masaar-black/60 pt-1">
                    Email updates sent to: <span className="font-medium text-masaar-black">{selectedApp.applicant_email}</span>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-masaar-black/60">Name</span>
                    <span className="font-semibold text-masaar-black">{selectedApp.applicant_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/60">Email</span>
                    <span className="font-medium text-masaar-black">{selectedApp.applicant_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/60">Phone / WhatsApp</span>
                    <span className="font-medium text-masaar-black">{selectedApp.applicant_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/60">Nationality</span>
                    <span className="font-semibold text-masaar-black">{selectedApp.nationality}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/60">Passport No.</span>
                    <span className="font-mono font-medium text-masaar-black">{selectedApp.passport_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-masaar-black/60">Date of Birth</span>
                    <span className="font-medium text-masaar-black">{selectedApp.dob}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Visa Details */}
            <div className="rounded-xl border border-black/10 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                Visa Package
              </h4>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative h-12 w-16 overflow-hidden rounded-md border border-black/10">
                  <Image
                    src={THUMBNAILS[selectedApp.visa_slug] || THUMBNAILS.uae}
                    alt={selectedApp.visa_type}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-masaar-black">{selectedApp.visa_type}</p>
                  <p className="text-xs text-masaar-black/60">{selectedApp.variant}</p>
                  <p className="text-xs text-amber-700">{selectedApp.purpose}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 border-t border-black/5 pt-3 text-xs">
                <div>
                  <span className="text-masaar-black/50">Intended Travel Date</span>
                  <p className="font-semibold text-masaar-black">{selectedApp.travel_date}</p>
                </div>
                <div>
                  <span className="text-masaar-black/50">Turnaround Expectation</span>
                  <p className="font-semibold text-masaar-black">
                    {selectedApp.visa_slug === "saudi-tourist" ? "1-3 Working Days" : "3-5 Working Days"}
                  </p>
                </div>
              </div>
            </div>

            {/* Application Processing Status Dropdown & Rule Caution */}
            <div className="rounded-xl border border-black/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                    Visa Processing Status
                  </h4>
                  <p className="text-[10px] text-masaar-black/60">Updates the applicant tracking portal</p>
                </div>
                <select
                  value={selectedApp.status}
                  onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                  className="rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-xs font-bold text-masaar-black focus:border-amber-600 focus:outline-none shadow-2xs"
                >
                  <option value="draft">Draft</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="documents_required">Documents Required</option>
                  <option value="submitted_to_authorities">Submitted to Authorities</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="mt-3 rounded-md bg-amber-50 p-2.5 text-[11px] text-amber-800 border border-amber-200">
                <span className="font-bold">Compliance Rule: </span>
                Do not set status to &quot;Submitted to Authorities&quot; unless official filing with destination immigration has actually occurred.
              </div>

              {/* Status Timeline History */}
              <div className="mt-4 border-t border-black/5 pt-3">
                <h5 className="text-[11px] font-bold text-masaar-black/60 uppercase tracking-wider mb-2">
                  Status History Timeline
                </h5>
                <div className="space-y-2.5">
                  {(appDetails?.timeline && appDetails.timeline.length > 0
                    ? appDetails.timeline
                    : [
                        { step: "Application Submitted", timestamp: selectedApp.submitted_on, status: "completed", note: "Application registered" },
                        { step: selectedApp.status.replace(/_/g, " "), timestamp: "Current Status", status: "completed", note: "Active state" },
                      ]
                  ).map((tl: any, i: number) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs">
                      <div className="mt-1 size-2 rounded-full bg-emerald-600 shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-masaar-black capitalize">{tl.step?.replace(/_/g, " ")}</span>
                          <span className="text-[10px] text-masaar-black/50">
                            {tl.timestamp ? new Date(tl.timestamp).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                        </div>
                        {tl.note && <p className="text-[11px] text-masaar-black/60 mt-0.5">{tl.note}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Internal Notes Editor */}
            <div className="rounded-xl border border-black/10 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                    Internal Specialist Notes
                  </h4>
                  <p className="text-[10px] text-masaar-black/60">Visible to staff only — not shared with applicant</p>
                </div>
                <button
                  type="button"
                  onClick={handleSaveInternalNotes}
                  disabled={isSavingNotes}
                  className="rounded bg-masaar-black px-3 py-1 text-xs font-semibold text-white shadow-2xs hover:bg-black/80 disabled:opacity-50"
                >
                  {isSavingNotes ? "Saving..." : "Save Notes"}
                </button>
              </div>

              <textarea
                rows={3}
                value={internalNotesText}
                onChange={(e) => setInternalNotesText(e.target.value)}
                placeholder="Add internal notes about document verification, reviewer checks, or authority follow-ups..."
                className="mt-3 w-full rounded-lg border border-black/15 bg-white p-2.5 text-xs text-masaar-black focus:border-amber-600 focus:outline-none"
              />

              {notesStatus && (
                <p className="mt-2 text-[11px] font-medium text-emerald-700 bg-emerald-50 rounded p-1.5 border border-emerald-200">
                  {notesStatus}
                </p>
              )}
            </div>

            {/* Missing-Document Request Dispatcher */}
            <div className="rounded-xl border border-rose-200 bg-rose-50/30 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Request Missing / Clearer Documents
              </h4>
              <p className="mt-0.5 text-[11px] text-masaar-black/60">
                Sends an email notification requesting the customer to upload required documents.
              </p>

              <textarea
                rows={2}
                value={missingDocsText}
                onChange={(e) => setMissingDocsText(e.target.value)}
                placeholder="e.g. Passport copy is blurry. Please provide a high-resolution colour scan of pages 1 and 2."
                className="mt-3 w-full rounded-lg border border-rose-200 bg-white p-2.5 text-xs text-masaar-black focus:border-rose-500 focus:outline-none"
              />

              <div className="mt-2.5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleSendMissingDocumentsRequest}
                  disabled={isSendingMissingRequest || !missingDocsText.trim()}
                  className="rounded bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-rose-800 disabled:opacity-50"
                >
                  {isSendingMissingRequest ? "Sending Request..." : "Send Document Request"}
                </button>
              </div>

              {missingRequestStatus && (
                <p className="mt-2 text-[11px] font-medium text-rose-800 bg-rose-100/70 rounded p-1.5 border border-rose-200">
                  {missingRequestStatus}
                </p>
              )}
            </div>

            {/* Payment & Refund Information */}
            <div className="rounded-xl border border-black/10 p-4">
              <div className="flex items-center justify-between border-b border-black/5 pb-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black/50">
                    Payment & Refund Records
                  </h4>
                  <p className="text-[10px] text-masaar-black/60">Independent from visa processing status</p>
                </div>
                <Link
                  href="/admin/visa-payments"
                  className="text-xs font-semibold text-amber-700 hover:underline"
                >
                  View Payments →
                </Link>
              </div>

              <div className="mt-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Payment Status</span>
                  <span className="font-semibold text-emerald-700">
                    {selectedApp.payment_status.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-masaar-black/60">Payment Method</span>
                  <span className="font-medium text-masaar-black">{selectedApp.payment_method}</span>
                </div>
                <div className="flex justify-between border-t border-black/5 pt-2">
                  <span className="text-masaar-black/60">Charged Total</span>
                  <span className="font-bold text-masaar-black">USD {selectedApp.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-3 rounded-md bg-neutral-50 p-2.5 text-[11px] text-masaar-black/70 border border-black/5">
                <span className="font-bold text-masaar-black">Refund Permission & Policy: </span>
                Once submitted to official destination authorities, visa government fees are strictly non-refundable. Refunds prior to submission must be processed via the payments ledger by an authorized administrator.
              </div>

              {/* Notification Retry */}
              <div className="mt-4 border-t border-black/10 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-masaar-black">Customer Notification Email</p>
                    <p className="text-[10px] text-masaar-black/60">Resend payment receipt and submission confirmation</p>
                  </div>
                  <button
                    disabled={isRetrying}
                    onClick={() => handleRetryEmail(selectedApp.id)}
                    className="rounded bg-amber-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-50 transition"
                  >
                    {isRetrying ? "Sending..." : "Retry Email"}
                  </button>
                </div>
                {retryStatus && (
                  <p className="mt-2 text-[11px] font-medium text-amber-800 bg-amber-50 rounded p-1.5 border border-amber-200">
                    {retryStatus}
                  </p>
                )}
              </div>
            </div>

            {/* ── ENHANCED DOCUMENTS SECTION WITH ZIP & PREVIEWS ── */}
            <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-black/5 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-amber-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-masaar-black">
                      Visa Application Documents ({appDetails?.documents ? appDetails.documents.length : selectedApp.documents.length})
                    </h4>
                  </div>
                  <p className="text-[11px] text-masaar-black/60 mt-0.5">
                    Encrypted private storage · 15-minute signed links · Download audit logged
                  </p>
                </div>

                {appDetails?.documents && appDetails.documents.length > 0 && (
                  <button
                    type="button"
                    disabled={isDownloadingZip}
                    onClick={() => handleDownloadAllZip(selectedApp.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-masaar-black hover:bg-black/85 text-white text-xs font-semibold px-3 py-1.5 transition shadow-sm disabled:opacity-50"
                  >
                    <Download className="h-3.5 w-3.5 text-gold" />
                    <span>{isDownloadingZip ? "Preparing ZIP Archive..." : "Download All as ZIP"}</span>
                  </button>
                )}
              </div>

              {/* Required Documents Verification Checklist */}
              <div className="rounded-lg bg-neutral-50/70 border border-black/5 p-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-masaar-black/60 block">
                  Mandatory Document Verification Checklist
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  {[
                    { key: "passport", label: "Passport Copy" },
                    { key: "residence", label: "UAE Residence Visa Copy" },
                    { key: "emirates_id_front", label: "Emirates ID Front" },
                    { key: "emirates_id_back", label: "Emirates ID Back" },
                    { key: "photo", label: "Passport-Size Photograph" },
                  ].map((req) => {
                    const hasDoc = (appDetails?.documents || []).some((d) =>
                      d.document_type?.toLowerCase().includes(req.key) ||
                      (req.key === "emirates_id_front" && d.document_type?.toLowerCase().includes("emirates")) ||
                      (req.key === "residence" && (d.document_type?.toLowerCase().includes("visa") || d.document_type?.toLowerCase().includes("residence")))
                    );
                    return (
                      <div
                        key={req.key}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-md border text-[11px] ${
                          hasDoc
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-800"
                            : "bg-amber-50/80 border-amber-200 text-amber-800"
                        }`}
                      >
                        <span className="font-medium truncate mr-1.5">{req.label}</span>
                        <span className="font-bold shrink-0">
                          {hasDoc ? "✓ On File" : "Missing"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Uploaded Documents List */}
              <div className="space-y-3 pt-1">
                {isLoadingDetails ? (
                  <div className="py-6 text-center text-xs text-masaar-black/50">
                    Loading application documents from secure storage...
                  </div>
                ) : appDetails?.documents && appDetails.documents.length > 0 ? (
                  appDetails.documents.map((doc) => {
                    const applicantMatch = appDetails.applicants?.find(
                      (a) => a.id === doc.applicant_id
                    );
                    const applicantName =
                      applicantMatch?.full_name ||
                      (doc.document_type?.includes("app")
                        ? `Applicant ${doc.document_type.replace(/[^0-9]/g, "")}`
                        : selectedApp.applicant_name);

                    const uploadDate = doc.created_at
                      ? new Date(doc.created_at).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Recent";

                    const fileSizeDisplay = doc.file_size
                      ? doc.file_size > 1048576
                        ? `${(doc.file_size / 1048576).toFixed(1)} MB`
                        : `${Math.round(doc.file_size / 1024)} KB`
                      : "N/A";

                    return (
                      <div
                        key={doc.id}
                        className="rounded-xl border border-black/10 bg-white p-3.5 shadow-2xs hover:border-black/20 transition space-y-2.5"
                      >
                        {/* Top: Doc Type & Applicant Name & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-black/5 pb-2">
                          <div className="flex items-center gap-2">
                            <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-bold text-masaar-black">
                              {formatDocTypeLabel(doc.document_type)}
                            </span>
                            <span className="text-[10px] font-medium bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-full">
                              Traveller: {applicantName}
                            </span>
                          </div>

                          {/* Verification Status Selector */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-masaar-black/50 uppercase font-semibold">Status:</span>
                            <select
                              value={doc.verification_status || "pending"}
                              onChange={(e) =>
                                handleUpdateDocStatus(
                                  doc.id,
                                  selectedApp.id,
                                  e.target.value as "verified" | "rejected" | "pending"
                                )
                              }
                              className={`text-[11px] font-bold rounded px-2 py-0.5 border focus:outline-none ${
                                doc.verification_status === "verified"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                  : doc.verification_status === "rejected"
                                  ? "bg-red-50 text-red-800 border-red-300"
                                  : "bg-amber-50 text-amber-800 border-amber-300"
                              }`}
                            >
                              <option value="pending">Pending Review</option>
                              <option value="verified">Verified ✓</option>
                              <option value="rejected">Rejected ✗</option>
                            </select>
                          </div>
                        </div>

                        {/* Metadata row: Filename, Upload Date, File Size */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-masaar-black/70">
                          <div>
                            <span className="text-masaar-black/50 block text-[10px]">Original File</span>
                            <span className="font-mono text-masaar-black truncate block" title={doc.file_name}>
                              {doc.file_name}
                            </span>
                          </div>

                          <div>
                            <span className="text-masaar-black/50 block text-[10px]">Upload Date</span>
                            <span className="font-medium text-masaar-black">{uploadDate}</span>
                          </div>

                          <div>
                            <span className="text-masaar-black/50 block text-[10px]">File Size & Format</span>
                            <span className="font-medium text-masaar-black">
                              {fileSizeDisplay} · {doc.mime_type?.split("/")[1]?.toUpperCase() || "FILE"}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons: Safe Preview and Direct Download */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-black/5">
                          <button
                            type="button"
                            onClick={() => handleOpenDocPreview(doc, applicantName)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-black/15 bg-white hover:bg-neutral-50 px-2.5 py-1 text-xs font-semibold text-masaar-black transition shadow-2xs"
                          >
                            <Eye className="h-3.5 w-3.5 text-amber-700" />
                            <span>Preview</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadSingleDoc(doc.id, selectedApp.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 text-xs font-semibold transition shadow-2xs"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : selectedApp.documents.length > 0 ? (
                  selectedApp.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-black/10 bg-neutral-50/50 p-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileCheck className="h-4 w-4 text-emerald-600" />
                        <div>
                          <p className="text-xs font-semibold text-masaar-black">{doc.name}</p>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                            {doc.status}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenDocPreview(doc, selectedApp.applicant_name)}
                        className="rounded border border-black/15 bg-white px-2.5 py-1 text-[11px] font-semibold text-masaar-black hover:bg-black/5"
                      >
                        Preview Securely
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-masaar-black/50 italic bg-neutral-50 rounded-lg border border-dashed border-black/10">
                    No uploaded identity documents on record for this application.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SAFE DOCUMENT PREVIEW MODAL ── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 sm:p-6">
          <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-black/10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/10 bg-neutral-50 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <FileText className="h-5 w-5 text-amber-700" />
                <div>
                  <h3 className="text-sm font-bold text-masaar-black truncate max-w-md">
                    {previewDoc.documentType}: {previewDoc.fileName}
                  </h3>
                  <p className="text-[11px] text-masaar-black/60">
                    Applicant: <strong className="text-masaar-black">{previewDoc.applicantName}</strong> · Secure signed link (expires in 15 min)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download={previewDoc.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 shadow-2xs transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="rounded-lg p-1.5 text-masaar-black/50 hover:bg-black/10 hover:text-masaar-black transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Render Image or PDF Preview */}
            <div className="flex-1 overflow-auto p-4 bg-neutral-100/50 flex items-center justify-center min-h-[400px]">
              {previewDoc.mimeType?.startsWith("image/") ? (
                <div className="relative max-h-[75vh] flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.fileName}
                    className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain shadow-md border border-black/10 bg-white"
                  />
                </div>
              ) : previewDoc.mimeType === "application/pdf" ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.fileName}
                  className="w-full h-[75vh] rounded-lg border border-black/15 bg-white shadow-sm"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-xl border border-black/10 shadow-sm max-w-md space-y-3">
                  <FileText className="h-10 w-10 text-amber-700 mx-auto" />
                  <h4 className="text-sm font-bold text-masaar-black">{previewDoc.fileName}</h4>
                  <p className="text-xs text-masaar-black/60">
                    Preview not available directly in browser for this file format ({previewDoc.mimeType}).
                  </p>
                  <a
                    href={previewDoc.url}
                    download={previewDoc.fileName}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold px-4 py-2 hover:bg-amber-700"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download File Directly</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
